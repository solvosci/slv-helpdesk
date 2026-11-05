/** @odoo-module **/

import {patch} from "@web/core/utils/patch";
import {_t} from "@web/core/l10n/translation";
import {TeamPerformance} from "@helpdesk_mgmt_team_overview/components/panel/helpdesk_ticket.esm";

const NO_TEAM_KEY = "none";
const MAX_AVATARS = 5;
const KINDS = {main: false, extra: true};

patch(TeamPerformance.prototype, {
    async _loadStats() {
        await this._loadRelatedStats();
        return super._loadStats(...arguments);
    },

    async _loadRelatedStats() {
        const userIds = Object.keys(this.usersById).map(Number);
        this._relatedStats = {};
        for (const kind of Object.keys(KINDS)) {
            this._relatedStats[kind] = {total: {}, closed: {}, owners: {}};
        }
        if (!userIds.length) return;

        await Promise.all(Object.entries(KINDS).map(async ([kind, isExtra]) => {
            const domain = this._relatedDomain(userIds, isExtra);
            const [all, closed] = await Promise.all([
                this._groupRelated(domain),
                this._groupRelated([...domain, ["closed", "=", true]]),
            ]);
            this._relatedStats[kind] = {total: all.counts, owners: all.owners, closed: closed.counts};
        }));
    },

    async _groupRelated(domain) {
        const fields = ["related_user_ids", "user_id", "team_id"];
        const groups = await this.orm.readGroup("helpdesk.ticket", domain, fields, fields, {lazy: false});
        const counts = {};
        const owners = {};
        for (const g of groups) {
            if (!g.related_user_ids) continue;
            const uid = g.related_user_ids[0];
            const teamKey = g.team_id ? String(g.team_id[0]) : NO_TEAM_KEY;
            counts[uid] = counts[uid] || {};
            counts[uid][teamKey] = (counts[uid][teamKey] || 0) + g.__count;
            if (g.user_id) {
                owners[uid] = owners[uid] || {};
                owners[uid][teamKey] = owners[uid][teamKey] || {};
                owners[uid][teamKey][g.user_id[0]] = {id: g.user_id[0], name: g.user_id[1]};
            }
        }
        return {counts, owners};
    },

    _ownersFor(owners, userId, teamId) {
        const perTeam = owners[userId] || {};
        return Object.values({...perTeam[String(teamId)], ...perTeam[NO_TEAM_KEY]});
    },

    _buildMemberForUser(userData, teamId) {
        const member = super._buildMemberForUser(...arguments);
        member.related = {};
        for (const kind of Object.keys(KINDS)) {
            const stats = this._relatedStats[kind];
            const owners = this._ownersFor(stats.owners, member.userId, teamId);
            member.related[kind] = {
                closed: this._sumForUser(stats.closed, member.userId, teamId),
                total: this._sumForUser(stats.total, member.userId, teamId),
                owners: owners.slice(0, MAX_AVATARS),
                more: Math.max(0, owners.length - MAX_AVATARS),
            };
        }
        return member;
    },

    _relatedDomain(userIds, isExtra) {
        return [["related_user_ids", "in", userIds], ...this._periodDomain([0], isExtra).slice(1)];
    },

    _ownAndRelatedDomain(member, isExtra) {
        return [
            "|",
            ["user_id", "=", member.userId],
            ["related_user_ids", "in", [member.userId]],
            ...this._periodDomain([0], isExtra, member.teamId).slice(1),
        ];
    },

    _openObjectives(member, kind, title, ev) {
        this._togglePanel(member, kind, title, this._ownAndRelatedDomain(member, KINDS[kind]), "kanban", ev);
    },

    onMainObjectivesClick(member, ev) {
        this._openObjectives(member, "main", _t("Main Objectives"), ev);
    },

    onExtraObjectivesClick(member, ev) {
        this._openObjectives(member, "extra", _t("Extra Objectives"), ev);
    },

    async _fetchTickets(domain) {
        const tickets = await super._fetchTickets(...arguments);
        const rel = domain.find((d) => Array.isArray(d) && d[0] === "related_user_ids");
        if (!rel) return tickets;

        const uid = rel[2][0];
        for (const t of tickets) {
            t.isRelated = !t.user_id || t.user_id[0] !== uid;
        }
        tickets.sort((a, b) => a.isRelated - b.isRelated);

        const related = tickets.filter((t) => t.isRelated);
        const own = tickets.length - related.length;
        if (own && related.length) {
            Object.assign(tickets[0], {showOwnHeader: true, ownCount: own});
        }
        if (related.length) {
            Object.assign(related[0], {firstRelated: true, relatedCount: related.length});
        }
        return tickets;
    },
});
