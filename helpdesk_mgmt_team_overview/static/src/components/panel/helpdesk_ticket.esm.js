/** @odoo-module **/

import {Component, onWillStart, onMounted, onWillUnmount, useState, useRef, useEffect, useExternalListener} from "@odoo/owl";
import {useSetupAction} from "@web/webclient/actions/action_hook";
import {useService} from "@web/core/utils/hooks";
import {registry} from "@web/core/registry";
import {_t} from "@web/core/l10n/translation";
const {DateTime} = luxon;

const HOVER_LEAVE_MS = 180;
const TICKET_FIELDS = ["id", "number", "name", "stage_id", "start_date", "end_date", "closed", "priority", "user_id"];
const NO_TEAM_KEY = "none";

const PANEL_CLOSE_MS = 350;
const CARD_WIDTH = 640;
const EXPANDED_WIDTH = 640;
const EXPANDED_HEIGHT = 620;

export class TeamPerformance extends Component {
    static RING1_CIRCUMFERENCE = 2 * Math.PI * 100;
    static RING2_CIRCUMFERENCE = 2 * Math.PI * 76;

    setup() {
        this.actionService = useService("action");
        this.orm = useService("orm");
        this.user = useService("user");
        this.usersById = {};
        this.teams = [];
        this.accessScope = "own";
        this._hoverLeaveTimer = null;
        this._hoverToken = 0;

        const saved = this.props.state || {};

        this.state = useState({
            teams: [],
            periodMode: saved.periodMode || "week",
            periodOffset: saved.periodOffset || 0,
            activePanel: null,
            hoverPanel: null,
            refreshing: false,
        });
        this.panelRef = useRef("sidePanel");
        this._panelSeq = 0;

        // Comprueba cada minuto si ha cambiado la semana/mes real
        this._rolloverTimer = setInterval(() => this._checkRollover(), 60000);
        onWillUnmount(() => clearInterval(this._rolloverTimer));

        // Los navegadores frenan los timers en pestañas ocultas: comprobar al volver
        useExternalListener(document, "visibilitychange", () => {
            if (!document.hidden) this._checkRollover();
        });

        useSetupAction({
            getLocalState: () => ({
                periodMode: this.state.periodMode,
                periodOffset: this.state.periodOffset,
                panel: this.state.activePanel && !this.state.activePanel.closing
                    ? {type: this.state.activePanel.type, memberId: this.state.activePanel.memberId}
                    : null,
            }),
        });

        useEffect(
            (openId) => { if (openId) this._playOpenAnimation(); },
            () => [this.state.activePanel?.openId]
        );

        onWillStart(async () => {
            await this._loadAccessScope();
            await this._loadTeams();
            await this._loadStats();
        });

        // NUEVO: reabre el panel que estaba desplegado
        onMounted(() => {
            if (saved.panel) this._restorePanel(saved.panel);
        });

        useExternalListener(document, "click", (ev) => {
            if (!this.state.activePanel) return;
            const keep = ".o_tp_stat_trigger, .o_tp_side_panel, .o_tp_panel_backdrop, .o_dialog, .o_dialog_container, .modal";
            if (ev.target.closest(keep)) return;
            this._closePanel();
        });
    }

    /* === 0. Ámbito de acceso según grupo de seguridad de Helpdesk ======== */

    async _loadAccessScope() {
        const [isManager, isFullUser, isTeamUser] = await Promise.all([
            this.user.hasGroup("helpdesk_mgmt.group_helpdesk_manager"),
            this.user.hasGroup("helpdesk_mgmt.group_helpdesk_user"),
            this.user.hasGroup("helpdesk_mgmt.group_helpdesk_user_team"),
        ]);

        if (isManager || isFullUser) {
            this.accessScope = "all";
        } else if (isTeamUser) {
            this.accessScope = "team";
        } else {
            this.accessScope = "own";
        }
    }

    /* === 1. Carga: helpdesk.ticket.team → res.users ====================== */

    async _loadTeams() {
        this.teams = await this.orm.searchRead(
            "helpdesk.ticket.team",
            [["user_ids", "!=", false], ["ticket_control", "=", true]],
            ["id", "name", "user_ids"],
            {limit: 100}
        );

        if (this.accessScope === "team" || this.accessScope === "own") {
            this.teams = this.teams.filter((t) => t.user_ids.includes(this.user.userId));
        }

        const userIds = [...new Set(this.teams.flatMap((t) => t.user_ids))];
        this.usersById = {};
        if (!userIds.length) return;

        const users = await this.orm.searchRead(
            "res.users", [["id", "in", userIds]], ["id", "name", "image_128"], {limit: 500}
        );
        for (const u of users) {
            this.usersById[u.id] = {userId: u.id, name: u.name, image_128: u.image_128 || false};
        }
    }

    async _loadStats() {
        this._realKey = this._realPeriodKey();
        const userIds = Object.keys(this.usersById).map(Number);

        const [open, mainTeam, extraTeam, closed] = await Promise.all([
            this._countByUserTeam([["user_id", "in", userIds], ["closed", "=", false]]),
            this._getObjectivesCountsByTeam(userIds, false),
            this._getObjectivesCountsByTeam(userIds, true),
            this._countByUserTeam([["user_id", "in", userIds], ...this._closedDateDomain()]),
        ]);

        this.state.teams = this._buildTeamGroups({open, mainTeam, extraTeam, closed});
    }

    async onTogglePeriod(mode) {
        if (mode === this.state.periodMode) return;
        Object.assign(this.state, {hoverPanel: null, periodMode: mode, periodOffset: 0});
        await this._loadStats();
    }

    async onPeriodNav(delta) {
        this.state.hoverPanel = null;
        this.state.periodOffset += delta;
        await this._loadStats();
    }

    async onPeriodToday() {
        if (this.state.periodOffset === 0) return;
        this.state.hoverPanel = null;
        this.state.periodOffset = 0;
        await this._loadStats();
    }

    async onRefresh() {
        if (this.state.refreshing) return;
        this.state.refreshing = true;
        this.state.hoverPanel = null;
        try {
            await this._loadTeams();
            await this._loadStats();
            const panel = this.state.activePanel;
            if (panel && !panel.closing) await this._refreshActivePanel();
        } finally {
            this.state.refreshing = false;
        }
    }

    _realPeriodKey() {
        const now = DateTime.local();
        const start = this.state.periodMode === "month" ? now.startOf("month") : now.startOf("week");
        return `${this.state.periodMode}-${start.toISODate()}`;
    }

    async _checkRollover() {
        if (this.state.refreshing || this._realKey === this._realPeriodKey()) return;
        if (this.state.activePanel) this._closePanel();
        await this.onRefresh();
    }

    /* === 2. Estadísticas por (equipo, usuario) ============================ */

    _sumForUser(nestedCounts, userId, teamId) {
        const perTeam = nestedCounts[userId] || {};
        return (perTeam[String(teamId)] || 0) + (perTeam[NO_TEAM_KEY] || 0);
    }

    _buildMemberForUser(userData, teamId, {open, mainTeam, extraTeam, closed}) {
        const uid = userData.userId;
        const mainClosed = this._sumForUser(mainTeam.closed, uid, teamId);
        const mainTotal = this._sumForUser(mainTeam.total, uid, teamId);
        const extraClosed = this._sumForUser(extraTeam.closed, uid, teamId);
        const extraTotal = this._sumForUser(extraTeam.total, uid, teamId);

        return {
            id: `${teamId}-${uid}`,
            userId: uid,
            teamId,
            name: userData.name,
            image_128: userData.image_128,
            mainObjectivesClosed: mainClosed,
            mainObjectivesTotal: mainTotal,
            extraObjectivesClosed: extraClosed,
            extraObjectivesTotal: extraTotal,
            mainObjectivesPercent: this._pct(mainClosed, mainTotal),
            extraObjectivesPercent: this._pct(extraClosed, extraTotal),
            closedThisPeriod: this._sumForUser(closed, uid, teamId),
            openTicketsCount: this._sumForUser(open, uid, teamId),
            ring1Circumference: TeamPerformance.RING1_CIRCUMFERENCE.toFixed(2),
            ring2Circumference: TeamPerformance.RING2_CIRCUMFERENCE.toFixed(2),
            ring1Offset: this._computeRingOffset(mainClosed, mainTotal, TeamPerformance.RING1_CIRCUMFERENCE),
            ring2Offset: this._computeRingOffset(extraClosed, extraTotal, TeamPerformance.RING2_CIRCUMFERENCE),
            ring1Complete: mainTotal > 0 && mainClosed >= mainTotal,
            ring2Complete: extraTotal > 0 && extraClosed >= extraTotal,
        };
    }

    _pct(closed, total) {
        return total > 0 ? Math.round((closed / total) * 100) : 0;
    }

    _computeRingOffset(closed, total, circumference) {
        const percent = total > 0 ? Math.min(closed / total, 1) : 0;
        return (circumference * (1 - percent)).toFixed(2);
    }

    /* === 3. Periodo (semana lunes-lunes / mes, con navegación) ========== */

    _getPeriodRange() {
        const now = DateTime.local();
        const offset = this.state.periodOffset;
        if (this.state.periodMode === "month") {
            const start = now.startOf("month").plus({months: offset});
            return {start, end: start.plus({months: 1})};
        }
        const start = now.minus({days: now.weekday - 1}).startOf("day").plus({weeks: offset});
        return {start, end: start.plus({days: 7})};
    }

    getPeriodLabel() {
        const {start, end} = this._getPeriodRange();
        if (this.state.periodMode === "month") {
            const label = start.setLocale("es").toFormat("LLLL yyyy");
            return label.charAt(0).toUpperCase() + label.slice(1);
        }
        const lastDay = end.minus({days: 1});
        const label = start.month === lastDay.month
            ? `${start.toFormat("d")} - ${lastDay.toFormat("d 'de' LLLL")}`
            : `${start.toFormat("d LLL")} - ${lastDay.toFormat("d LLL yyyy")}`;
        return start.month === lastDay.month ? label.replace(/^\w/, (c) => c.toUpperCase()) : label;
    }

    _periodDomain(userIds, extra = null, teamId = undefined) {
        const {start, end} = this._getPeriodRange();
        const today = DateTime.local().startOf("day").toFormat("yyyy-MM-dd");

        const domain = [["user_id", "in", userIds]];
        if (teamId !== undefined) domain.push(["team_id", "in", [teamId, false]]);
        if (extra !== null) domain.push(["extra_objetive", "=", extra]);

        domain.push(
            "|",
            "&", ["start_date", "<", end.toFormat("yyyy-MM-dd")], ["end_date", ">=", start.toFormat("yyyy-MM-dd")],
            "&", ["closed", "=", false], ["end_date", "<", today]
        );

        return domain;
    }

    /* === 4. Lecturas agregadas (readGroup por usuario + equipo) ========== */

    async _countByUserTeam(domain) {
        const groups = await this.orm.readGroup(
            "helpdesk.ticket", domain, ["user_id", "team_id"], ["user_id", "team_id"], {lazy: false}
        );
        const counts = {};
        for (const g of groups) {
            if (!g.user_id) continue;
            const uid = g.user_id[0];
            const teamKey = g.team_id ? String(g.team_id[0]) : NO_TEAM_KEY;
            counts[uid] = counts[uid] || {};
            counts[uid][teamKey] = (counts[uid][teamKey] || 0) + g.__count;
        }
        return counts;
    }

    async _getObjectivesCountsByTeam(userIds, isExtra) {
        if (!userIds.length) return {total: {}, closed: {}};
        const domain = this._periodDomain(userIds, isExtra);
        const [total, closed] = await Promise.all([
            this._countByUserTeam(domain),
            this._countByUserTeam([...domain, ["closed", "=", true]]),
        ]);
        return {total, closed};
    }

    _closedDateDomain(teamId = undefined) {
        const {start, end} = this._getPeriodRange();
        const domain = [
            ["closed", "=", true],
            ["closed_date", ">=", start.toFormat("yyyy-MM-dd HH:mm:ss")],
            ["closed_date", "<", end.toFormat("yyyy-MM-dd HH:mm:ss")],
        ];
        if (teamId !== undefined) domain.push(["team_id", "in", [teamId, false]]);
        return domain;
    }

    /* === 5. Tickets: fetch compartido + panel lateral ==================== */

    async _fetchTickets(domain, limit = 50) {
        const tickets = await this.orm.searchRead("helpdesk.ticket", domain, TICKET_FIELDS, {limit});
        const today = DateTime.local().startOf("day");

        for (const t of tickets) {
            t.priorityStars = [1, 2, 3].map((n) => n <= (parseInt(t.priority, 10) || 0));
            t.member = t.user_id ? this.usersById[t.user_id[0]] : null;

            if (t.end_date) {
                const end = DateTime.fromFormat(t.end_date, "yyyy-MM-dd");
                const daysLeft = end.diff(today, "days").days;
                Object.assign(t, {
                    endDateDisplay: end.toFormat("dd/MM/yyyy"),
                    endDateSort: end.toMillis(),
                    dueSoon: !t.closed && daysLeft >= 0 && daysLeft <= 2,
                    overdue: !t.closed && daysLeft < 0,
                });
            } else {
                Object.assign(t, {endDateDisplay: "", endDateSort: Infinity, dueSoon: false, overdue: false});
            }
        }
        return tickets.sort((a, b) => (a.closed !== b.closed ? (a.closed ? 1 : -1) : a.endDateSort - b.endDateSort));
    }

    _getCardRect(memberId) {
        const el = document.querySelector(`.o_user_card_wrapper[data-member-id="${memberId}"]`);
        return el ? el.getBoundingClientRect() : null;
    }

    _prefersReducedMotion() {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    _computeFlip(panelEl, cardRect) {
        panelEl.getAnimations().forEach((a) => a.cancel());
        const P = panelEl.getBoundingClientRect();
        const Q = panelEl.querySelector(".o_tp_panel_profile").getBoundingClientRect();
        const s = cardRect.width / Q.width;
        return {
            s,
            tx: cardRect.left - P.left - s * (Q.left - P.left),
            ty: cardRect.top - P.top - s * (Q.top - P.top),
        };
    }

    _playOpenAnimation() {
        const el = this.panelRef.el;
        const panel = this.state.activePanel;
        if (!el || !panel || this._prefersReducedMotion()) return;
        const cardRect = this._getCardRect(panel.memberId);
        if (!cardRect) return;

        const {s, tx, ty} = this._computeFlip(el, cardRect);
        const easing = "cubic-bezier(.2,.8,.2,1)";
        el.animate(
            [{transform: `translate(${tx}px, ${ty}px) scale(${s})`}, {transform: "none"}],
            {duration: 380, easing}
        );

        // Móvil: los tickets están debajo del perfil, así que entran desde arriba
        const isMobile = window.matchMedia("(max-width: 767px)").matches;
        el.querySelector(".o_tp_panel_tickets")?.animate(
            [
                {opacity: 0, transform: isMobile ? "translateY(-30px)" : "translateX(-40px)"},
                {opacity: 1, transform: "none"},
            ],
            {duration: 260, delay: 200, easing, fill: "backwards"}
        );
    }

    _closePanel() {
        const panel = this.state.activePanel;
        if (!panel || panel.closing) return;
        panel.closing = true;

        const el = this.panelRef.el;
        const cardRect = this._getCardRect(panel.memberId);
        const finish = () => {
            if (this.state.activePanel?.openId === panel.openId) this.state.activePanel = null;
        };
        if (!el || !cardRect || this._prefersReducedMotion()) return finish();

        const {s, tx, ty} = this._computeFlip(el, cardRect);
        el.querySelector(".o_tp_panel_tickets")?.animate(
            [{opacity: 1}, {opacity: 0}],
            {duration: 150, fill: "forwards"}
        );
        el.animate(
            [{transform: "none"}, {transform: `translate(${tx}px, ${ty}px) scale(${s})`}],
            {duration: 320, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards"}
        ).finished.then(finish).catch(finish);
    }

    async _togglePanel(member, type, title, domain, viewType = "kanban") {
        const key = `${type}-${member.id}`;
        if (this.state.activePanel?.key === key) return this._closePanel();

        if (this.state.activePanel && this.state.activePanel.memberId === member.id && !this.state.activePanel.closing) {
            Object.assign(this.state.activePanel, {key, type, title, domain, viewType, loading: true, tickets: []});
            await this._refreshActivePanel();
            return;
        }

        this.state.activePanel = {
            key, type, title, domain, viewType,
            memberId: member.id, memberName: member.name, userId: member.userId,
            member,
            loading: true, tickets: [], closing: false,
            openId: ++this._panelSeq,
        };
        await this._refreshActivePanel();
    }

    async _refreshActivePanel() {
        const panel = this.state.activePanel;
        if (!panel) return;
        panel.loading = true;
        const tickets = await this._fetchTickets(panel.domain);
        if (this.state.activePanel?.key === panel.key) {
            this.state.activePanel.tickets = tickets;
            this.state.activePanel.loading = false;
        }
    }

    closeActivePanel() {
        this._closePanel();
    }

    /* === 6. Disparadores de panel ========================================= */

    onMemberPhotoClick(member) {
        this.actionService.doAction({
            type: "ir.actions.act_window",
            name: _t("All Tickets: %s", member.name),
            res_model: "helpdesk.ticket",
            views: [[false, "kanban"], [false, "form"]],
            domain: [["user_id", "=", member.userId], ["team_id", "in", [member.teamId, false]]],
            context: {group_by: false},
        });
    }

    onMainObjectivesClick(member, ev) {
        this._togglePanel(
            member, "main", _t("Main Objectives"),
            this._periodDomain([member.userId], false, member.teamId),
            "kanban", ev
        );
    }

    onExtraObjectivesClick(member, ev) {
        this._togglePanel(
            member, "extra", _t("Extra Objectives"),
            this._periodDomain([member.userId], true, member.teamId),
            "kanban", ev
        );
    }

    onTicketClosedClick(member) {
        const domain = [["user_id", "=", member.userId], ...this._closedDateDomain(member.teamId)];
        this._togglePanel(member, "closed", _t("Closed Tickets"), domain, "list");
    }

    onTicketOpenClick(member) {
        const domain = [
            ["user_id", "=", member.userId],
            ["closed", "=", false],
            ["team_id", "in", [member.teamId, false]],
        ];
        this._togglePanel(member, "open", _t("Opened Tickets"), domain);
    }

    /* === 6b. Panel flotante de equipo (hover Main/Extra) ================== */

    onTeamBarEnter(team, type) {
        clearTimeout(this._hoverLeaveTimer);
        const key = `${type}-${team.id}`;
        if (this.state.hoverPanel?.key === key) return;

        const token = ++this._hoverToken;
        this.state.hoverPanel = {
            key, type, teamId: team.id,
            title: type === "extra" ? _t("Extra Objectives") : _t("Main Objectives"),
            loading: true, tickets: [],
        };

        const domain = this._periodDomain(
            team.employees.map((m) => m.userId), type === "extra", team.id
        );
        this._fetchTickets(domain, 100).then((tickets) => {
            if (token !== this._hoverToken) return;
            if (this.state.hoverPanel?.key === key) {
                this.state.hoverPanel.tickets = tickets;
                this.state.hoverPanel.loading = false;
            }
        });
    }

    onTeamBarLeave() {
        clearTimeout(this._hoverLeaveTimer);
        this._hoverLeaveTimer = setTimeout(() => (this.state.hoverPanel = null), HOVER_LEAVE_MS);
    }

    onHoverPanelMouseEnter() {
        clearTimeout(this._hoverLeaveTimer);
    }

    onHoverPanelMouseLeave() {
        this.onTeamBarLeave();
    }

    /* === 7. Navegación hacia Odoo ========================================= */
    _restorePanel({type, memberId}) {
        const member = this.state.teams.flatMap((t) => t.employees).find((m) => m.id === memberId);
        if (!member) return;
        const handlers = {
            main: this.onMainObjectivesClick,
            extra: this.onExtraObjectivesClick,
            closed: this.onTicketClosedClick,
            open: this.onTicketOpenClick,
        };
        handlers[type]?.call(this, member);
    }

    onOpenActivePanelInOdoo() {
        const panel = this.state.activePanel;
        if (!panel) return;
        this.actionService.doAction({
            type: "ir.actions.act_window",
            name: panel.title,
            res_model: "helpdesk.ticket",
            views: [[false, panel.viewType], [false, "form"]],
            domain: panel.domain,
            context: {group_by: false},
        });
    }

    async onTicketRowClick(ticketId, ev) {
        const host = document.querySelector(".o_action_manager");
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let observer = null;
        let stopTimer = null;

        if (host && ev && !reduced) {
            const r = host.getBoundingClientRect();
            const origin = `${ev.clientX - r.left}px ${ev.clientY - r.top}px`;

            observer = new MutationObserver((mutations) => {
                for (const m of mutations) {
                    for (const node of m.addedNodes) {
                        if (node.nodeType !== 1) continue;
                        node.animate(
                            [
                                {transformOrigin: origin, transform: "scale(0.55)", opacity: 0},
                                {transformOrigin: origin, opacity: 1, offset: 0.6},
                                {transformOrigin: origin, transform: "none", opacity: 1},
                            ],
                            {duration: 320, easing: "cubic-bezier(.2,.9,.25,1)"}
                        );
                        observer.disconnect();
                        clearTimeout(stopTimer);
                        return;
                    }
                }
            });
            observer.observe(host, {childList: true});
            stopTimer = setTimeout(() => observer.disconnect(), 5000); // seguridad
        }

        try {
            await this.actionService.doAction({
                type: "ir.actions.act_window",
                name: _t("Ticket"),
                res_model: "helpdesk.ticket",
                res_id: ticketId,
                views: [[false, "form"]],
                target: "current",
            });
        } catch (e) {
            observer?.disconnect();
            clearTimeout(stopTimer);
            throw e;
        }
    }
    /* === 8. Agrupación — depende del ámbito de acceso ===================== */

    _buildTeamGroups(statsData) {
        const groups = this.teams.map((team) => {
            const memberUserIds = this.accessScope === "own"
                ? team.user_ids.filter((uid) => uid === this.user.userId)
                : team.user_ids;

            return {
                id: team.id,
                name: team.name,
                employees: memberUserIds
                    .map((uid) => this.usersById[uid])
                    .filter(Boolean)
                    .map((userData) => this._buildMemberForUser(userData, team.id, statsData)),
            };
        });
        for (const g of groups) this._applyTeamStats(g);
        return groups.sort((a, b) => a.name.localeCompare(b.name));
    }

    _applyTeamStats(team) {
        const sums = team.employees.reduce((acc, m) => {
            acc.mc += m.mainObjectivesClosed; acc.mt += m.mainObjectivesTotal;
            acc.ec += m.extraObjectivesClosed; acc.et += m.extraObjectivesTotal;
            return acc;
        }, {mc: 0, mt: 0, ec: 0, et: 0});

        Object.assign(team, {
            mainClosed: sums.mc, mainTotal: sums.mt, mainPercent: this._pct(sums.mc, sums.mt),
            extraClosed: sums.ec, extraTotal: sums.et, extraPercent: this._pct(sums.ec, sums.et),
        });
    }
}

TeamPerformance.template = "helpdesk_mgmt_team_overview.TeamPerformance";
registry.category("actions").add("helpdesk_mgmt_team_overview.action_helpdesk_personals_list", TeamPerformance);
