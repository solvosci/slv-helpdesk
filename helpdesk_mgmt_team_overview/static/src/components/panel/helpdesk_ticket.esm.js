/** @odoo-module **/

import {Component, onWillStart, useState, useExternalListener} from "@odoo/owl";
import {useService} from "@web/core/utils/hooks";
import {registry} from "@web/core/registry";
import {_t} from "@web/core/l10n/translation";
const {DateTime} = luxon;

const PANEL_CLOSE_MS = 350;
const HOVER_LEAVE_MS = 180;
const TICKET_FIELDS = ["id", "number", "name", "stage_id", "start_date", "end_date", "closed", "priority", "user_id"];

export class TeamPerformance extends Component {
    static RING1_CIRCUMFERENCE = 2 * Math.PI * 100;
    static RING2_CIRCUMFERENCE = 2 * Math.PI * 76;

    setup() {
        this.actionService = useService("action");
        this.orm = useService("orm");
        this.membersByUserId = {};
        this.teams = [];
        this._hoverLeaveTimer = null;
        this._hoverToken = 0;

        this.state = useState({
            teams: [],
            periodMode: "week",
            periodOffset: 0,
            activePanel: null,
            hoverPanel: null,
        });

        onWillStart(async () => {
            await this._loadTeams();
            await this._loadStats();
        });

        useExternalListener(document, "click", (ev) => {
            if (!this.state.activePanel) return;
            const keep = ".o_tp_stat_trigger, .o_tp_side_panel, .o_dialog, .o_dialog_container, .modal";
            if (ev.target.closest(keep)) return;
            this._closePanel();
        });
    }

    /* === 1. Carga: helpdesk.ticket.team → res.users ====================== */

    async _loadTeams() {
        this.teams = await this.orm.searchRead(
            "helpdesk.ticket.team",
            [["user_ids", "!=", false], ["ticket_control", "=", true]],
            ["id", "name", "user_ids"],
            {limit: 100}
        );

        const userIds = [...new Set(this.teams.flatMap((t) => t.user_ids))];
        this.membersByUserId = {};
        if (!userIds.length) return;

        const users = await this.orm.searchRead(
            "res.users", [["id", "in", userIds]], ["id", "name", "image_128"], {limit: 500}
        );
        for (const u of users) {
            this.membersByUserId[u.id] = {id: u.id, userId: u.id, name: u.name, image_128: u.image_128 || false};
        }
    }

    async _loadStats() {
        const userIds = Object.keys(this.membersByUserId).map(Number);
        const [open, main, extra, closed] = await Promise.all([
            this._countByUser([["user_id", "in", userIds], ["closed", "=", false]]),
            this._getObjectivesCounts(userIds, false),
            this._getObjectivesCounts(userIds, true),
            this._getClosedCounts(userIds),
        ]);
        for (const m of Object.values(this.membersByUserId)) {
            this._applyMemberStats(m, {open, main, extra, closed});
        }
        this.state.teams = this._buildTeamGroups();
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

    /* === 2. Estadísticas por miembro (anillos + contadores) ============= */

    _applyMemberStats(m, {open, main, extra, closed}) {
        const mainD = main[m.userId] || {closed: 0, total: 0};
        const extraD = extra[m.userId] || {closed: 0, total: 0};
        Object.assign(m, {
            mainObjectivesClosed: mainD.closed, mainObjectivesTotal: mainD.total,
            extraObjectivesClosed: extraD.closed, extraObjectivesTotal: extraD.total,
            mainObjectivesPercent: this._pct(mainD.closed, mainD.total),
            extraObjectivesPercent: this._pct(extraD.closed, extraD.total),
            closedThisPeriod: closed[m.userId] || 0,
            openTicketsCount: open[m.userId] || 0,
            ring1Circumference: TeamPerformance.RING1_CIRCUMFERENCE.toFixed(2),
            ring2Circumference: TeamPerformance.RING2_CIRCUMFERENCE.toFixed(2),
            ring1Offset: this._computeRingOffset(mainD.closed, mainD.total, TeamPerformance.RING1_CIRCUMFERENCE),
            ring2Offset: this._computeRingOffset(extraD.closed, extraD.total, TeamPerformance.RING2_CIRCUMFERENCE),
            ring1Complete: mainD.total > 0 && mainD.closed >= mainD.total,
            ring2Complete: extraD.total > 0 && extraD.closed >= extraD.total,
        });
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

    _periodDomain(userIds, extra = null) {
        const {start, end} = this._getPeriodRange();
        const domain = [
            ["user_id", "in", userIds],
            ["start_date", "<", end.toFormat("yyyy-MM-dd")],
            ["end_date", ">=", start.toFormat("yyyy-MM-dd")],
        ];
        return extra === null ? domain : [...domain, ["extra_objetive", "=", extra]];
    }

    /* === 4. Lecturas agregadas (readGroup) =============================== */

    async _countByUser(domain) {
        const groups = await this.orm.readGroup("helpdesk.ticket", domain, ["user_id"], ["user_id"]);
        const counts = {};
        for (const g of groups) if (g.user_id) counts[g.user_id[0]] = g.user_id_count;
        return counts;
    }

    async _getObjectivesCounts(userIds, isExtra) {
        if (!userIds.length) return {};
        const domain = this._periodDomain(userIds, isExtra);
        const [total, closed] = await Promise.all([
            this._countByUser(domain),
            this._countByUser([...domain, ["closed", "=", true]]),
        ]);
        const result = {};
        for (const uid of Object.keys(total)) result[uid] = {total: total[uid], closed: closed[uid] || 0};
        return result;
    }

    async _getClosedCounts(userIds) {
        if (!userIds.length) return {};
        return this._countByUser([["user_id", "in", userIds], ...this._closedDateDomain()]);
    }

    _closedDateDomain() {
        const {start, end} = this._getPeriodRange();
        return [
            ["closed", "=", true],
            ["closed_date", ">=", start.toFormat("yyyy-MM-dd HH:mm:ss")],
            ["closed_date", "<", end.toFormat("yyyy-MM-dd HH:mm:ss")],
        ];
    }

    /* === 5. Tickets: fetch compartido + panel lateral ==================== */

    async _fetchTickets(domain, limit = 50) {
        const tickets = await this.orm.searchRead("helpdesk.ticket", domain, TICKET_FIELDS, {limit});
        const today = DateTime.local().startOf("day");

        for (const t of tickets) {
            t.priorityStars = [1, 2, 3].map((n) => n <= (parseInt(t.priority, 10) || 0));
            t.member = t.user_id ? this.membersByUserId[t.user_id[0]] : null;

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

    async _togglePanel(member, type, title, domain, viewType = "kanban") {
        const key = `${type}-${member.id}`;
        if (this.state.activePanel?.key === key) return this._closePanel();

        this.state.activePanel = {
            key, type, title, domain, viewType,
            memberId: member.id, memberName: member.name, userId: member.userId,
            loading: true, tickets: [], closing: false,
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

    _closePanel() {
        const panel = this.state.activePanel;
        if (!panel || panel.closing) return;
        panel.closing = true;
        setTimeout(() => {
            if (this.state.activePanel?.key === panel.key && this.state.activePanel.closing) {
                this.state.activePanel = null;
            }
        }, PANEL_CLOSE_MS);
    }

    closeActivePanel() {
        this._closePanel();
    }

    /* === 6. Disparadores de panel (stats + anillos) ======================= */

    onMemberPhotoClick(member) {
        this.actionService.doAction({
            type: "ir.actions.act_window",
            name: _t("All Tickets: %s", member.name),
            res_model: "helpdesk.ticket",
            views: [[false, "kanban"], [false, "form"]],
            domain: [["user_id", "=", member.userId]],
            context: {group_by: false},
        });
    }

    onMainObjectivesClick(member) {
        this._togglePanel(member, "main", _t("Main Objectives"), this._periodDomain([member.userId], false));
    }

    onExtraObjectivesClick(member) {
        this._togglePanel(member, "extra", _t("Extra Objectives"), this._periodDomain([member.userId], true));
    }

    onTicketClosedClick(member) {
        const domain = [["user_id", "=", member.userId], ...this._closedDateDomain()];
        this._togglePanel(member, "closed", _t("Closed Tickets"), domain, "list");
    }

    onTicketOpenClick(member) {
        const domain = [["user_id", "=", member.userId], ["closed", "=", false]];
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

        const domain = this._periodDomain(team.employees.map((m) => m.userId), type === "extra");
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

    onTicketRowClick(ticketId) {
        this.actionService.doAction(
            {
                type: "ir.actions.act_window",
                res_model: "helpdesk.ticket",
                res_id: ticketId,
                views: [[false, "form"]],
                target: "new",
            },
            {onClose: async () => { await this._loadStats(); await this._refreshActivePanel(); }}
        );
    }

    /* === 8. Agrupación por equipo ========================================= */

    _buildTeamGroups() {
        const groups = this.teams.map((team) => ({
            id: team.id,
            name: team.name,
            employees: team.user_ids.map((uid) => this.membersByUserId[uid]).filter(Boolean),
        }));
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
