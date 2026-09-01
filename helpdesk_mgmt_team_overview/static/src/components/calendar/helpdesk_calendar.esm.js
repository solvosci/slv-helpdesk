// /** @odoo-module **/

import { Component, useState, useRef, onWillStart, onWillUpdateProps, useExternalListener } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import {_t} from "@web/core/l10n/translation";
import { sprintf } from "@web/core/utils/strings";

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
    _t("January"), _t("February"), _t("March"), _t("April"), _t("May"), _t("June"),
    _t("July"), _t("August"), _t("September"), _t("October"), _t("November"), _t("December"),
];

const WEEKDAY_NAMES = [_t("Mon"), _t("Tue"), _t("Wed"), _t("Thu"), _t("Fri"), _t("Sat"), _t("Sun")];
const TRACK_HEIGHT = 30; // px, alto de cada "carril" de ticket dentro de la fila de un usuario
const ROW_BOTTOM_MARGIN = 10; // px, espacio libre entre la última barra y el borde inferior de la fila

// Paleta estándar de colores de Odoo (la misma que usa el selector de color en kanban).
// El índice coincide con el campo "color" (integer) de helpdesk.ticket.team.
const ODOO_COLOR_PALETTE = [
    "#adb5bd", // 0 Sin color
    "#F06050", // 1 Rojo
    "#F4A460", // 2 Naranja
    "#F7CD1F", // 3 Amarillo
    "#6CC1ED", // 4 Cian
    "#814968", // 5 Morado
    "#EB7E7F", // 6 Almendra
    "#2C8397", // 7 Turquesa
    "#0000FF", // 8 Azul
    "#D6145F", // 9 Frambuesa
    "#30C381", // 10 Verde
    "#9365B8", // 11 Violeta
];
const NO_DEPARTMENT_COLOR = { bg: "rgba(107, 114, 128, 0.08)", text: "#5f5e5a" };

// ---------------------------------------------------------------------------
// Helpers de color (funciones puras, sin depender de "this")
// ---------------------------------------------------------------------------

/** Convierte el índice de color de helpdesk.ticket.team en {bg, text} usando la paleta de Odoo. */
function getDepartmentColor(colorIndex) {
    if (colorIndex === null || colorIndex === undefined) {
        return NO_DEPARTMENT_COLOR;
    }
    const hex = ODOO_COLOR_PALETTE[colorIndex] || ODOO_COLOR_PALETTE[0];
    return { bg: hex + "1A", text: hex }; // "1A" ≈ 10% de opacidad en hex
}

// ---------------------------------------------------------------------------
// Helpers de fecha (funciones puras, sin depender de "this")
// ---------------------------------------------------------------------------

/** Número de días que tiene un mes. month es 0-based (0 = Enero). */
function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

/** Convierte year/month(0-based)/day a "YYYY-MM-DD". */
function toDateStr(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Parsea "YYYY-MM-DD" a un Date en hora local (mediodía implícito 00:00). */
function parseDateStr(dateStr) {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function formatDateStr(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** "YYYY-MM-DD" del lunes de la semana a la que pertenece "date". */
function getWeekStartDate(date) {
    const weekday = date.getDay();
    const diff = (weekday + 6) % 7;
    const monday = new Date(date);
    monday.setDate(date.getDate() - diff);
    return formatDateStr(monday);
}

/**
 * Días completos entre dos fechas (dateB - dateA), calculado en UTC.
 * Usar UTC evita que el cambio de horario (DST) desplace el resultado en
 * ±1 día cuando el rango de fechas cruza esa transición.
 */
function daysBetween(dateA, dateB) {
    const utcA = Date.UTC(dateA.getFullYear(), dateA.getMonth(), dateA.getDate());
    const utcB = Date.UTC(dateB.getFullYear(), dateB.getMonth(), dateB.getDate());
    return Math.round((utcB - utcA) / (1000 * 60 * 60 * 24));
}

export class HelpdeskCalendar extends Component {
    // -------------------------------------------------------------------
    // Ciclo de vida / inicialización
    // -------------------------------------------------------------------

    setup() {
        this.orm = useService("orm");
        this.actionService = useService("action");
        this.tableContainerRef = useRef("tableContainer");

        const today = new Date();

        this.months = MONTH_NAMES.map((name, id) => ({ id, name }));

        this.state = useState({
            selectedMonth: today.getMonth(),
            selectedYear: today.getFullYear(),
            selectedWeekStart: getWeekStartDate(today),
            viewMode: "week",
            periodLabel: "",
            days: [],
            users: [],
            tickets: [],
            teams: [],
            selectedPartnerIds: [],
            selectedTeamIds: [],
            teamFilterOpen: false,
            contactFilterOpen: false,
            contactSearchQuery: "",
        });

        // Cierra los desplegables de filtro (equipos/contactos) al hacer click fuera de ellos.
        useExternalListener(document, "click", () => {
            this.state.teamFilterOpen = false;
            this.state.contactFilterOpen = false;
        });

        this.searchDomain = this.props.domain || [];

        onWillUpdateProps((nextProps) => {
            this.searchDomain = nextProps.domain || [];
            this.loadUsersAndTickets();
        });

        this.updateDays();
        // Carga inicial de datos antes del primer render
        onWillStart(() => this.loadUsersAndTickets());
    }

    /** Trae usuarios, equipos (con color) y tickets con fechas completas desde el backend. */
    async loadUsersAndTickets() {
        this.state.users = await this.orm.searchRead(
            "res.users",
            [
                ["helpdesk_team_ids", "!=", false],
                ["helpdesk_team_ids.ticket_control", "=", true]
            ],
            ["name", "id"]
        );
        this.state.teams = await this.orm.searchRead(
            "helpdesk.ticket.team",
            [["ticket_control", "=", true]],
            ["name", "user_ids", "color"]
        );

        const domain = [
            ["start_date", "!=", false],
            ["end_date", "!=", false],
            ...this.searchDomain,
        ];
        this.state.tickets = await this.orm.searchRead(
            "helpdesk.ticket",
            domain,
            ["user_id", "name", "start_date", "end_date", "id", "color", "closed", "priority", "partner_id", "team_id", "number", "stage_id"]
        );

    }

    // -------------------------------------------------------------------
    // Usuarios agrupados por equipo
    // -------------------------------------------------------------------

    /** Un grupo por cada equipo (con sus miembros), más un grupo "Sin equipo" para quien no esté en ninguno. */
    get groupedUsers() {
        const usersById = new Map(this.state.users.map((u) => [u.id, u]));
        const assignedUserIds = new Set();
        const groups = [];

        for (const team of this.state.teams) {
            const teamUsers = team.user_ids
                .map((userId) => usersById.get(userId))
                .filter(Boolean);
            teamUsers.forEach((u) => assignedUserIds.add(u.id));

            groups.push({
                id: team.id,
                name: team.name,
                color: getDepartmentColor(team.color),
                teamId: team.id,
                users: teamUsers,
            });
        }

        const unassignedUsers = this.state.users.filter((u) => !assignedUserIds.has(u.id));
        if (unassignedUsers.length) {
            groups.push({
                id: 0,
                name: "Without team",
                color: NO_DEPARTMENT_COLOR,
                teamId: null,
                users: unassignedUsers,
            });
        }

        const filtered = this.state.selectedTeamIds.length
            ? groups.filter((g) => this.state.selectedTeamIds.includes(g.id))
            : groups;

        // "Sin equipo" siempre al final; el resto, alfabético.
        filtered.sort((a, b) => {
            if (a.id === 0) return 1;
            if (b.id === 0) return -1;
            return a.name.localeCompare(b.name);
        });
        return filtered;
    }

    // -------------------------------------------------------------------
    // Filtro por contacto
    // -------------------------------------------------------------------

    /** Contactos únicos presentes en los tickets visibles en el periodo actual (semana/mes), ordenados alfabéticamente. */
    get availableContacts() {
        const seen = new Map();
        for (const ticket of this.state.tickets) {
            if (!ticket.partner_id || !this.isTicketVisibleInSelectedMonth(ticket)) {
                continue;
            }
            const [id, name] = ticket.partner_id;
            if (!seen.has(id)) {
                seen.set(id, name);
            }
        }
        return Array.from(seen.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    /** availableContacts filtrado por el texto escrito en el buscador del panel. */
    get filteredContacts() {
        const query = this.state.contactSearchQuery.trim().toLowerCase();
        if (!query) {
            return this.availableContacts;
        }
        return this.availableContacts.filter((c) => c.name.toLowerCase().includes(query));
    }

    onContactSearchInput(ev) {
        this.state.contactSearchQuery = ev.target.value;
    }

    // -------------------------------------------------------------------
    // Paneles de filtro (equipo / contacto)
    //
    // Ambos desplegables comparten la misma lógica de apertura (solo uno
    // abierto a la vez) y de selección múltiple sobre un array de ids,
    // así que esa lógica común vive en togglePanel() / toggleArrayItem().
    // -------------------------------------------------------------------

    /** Abre/cierra un panel de filtro (identificado por su clave en state) y cierra el otro. */
    togglePanel(stateKey, ev) {
        ev.stopPropagation();
        const willOpen = !this.state[stateKey];
        this.state.teamFilterOpen = false;
        this.state.contactFilterOpen = false;
        this.state[stateKey] = willOpen;
    }

    /** Añade/quita "id" de "list" (mutación in-place para mantener la reactividad de useState). */
    toggleArrayItem(list, id) {
        const index = list.indexOf(id);
        if (index === -1) {
            list.push(id);
        } else {
            list.splice(index, 1);
        }
    }

    toggleTeamFilterPanel(ev) {
        this.togglePanel("teamFilterOpen", ev);
    }

    toggleContactFilterPanel(ev) {
        this.togglePanel("contactFilterOpen", ev);
    }

    toggleTeamSelection(teamId, ev) {
        ev.stopPropagation();
        this.toggleArrayItem(this.state.selectedTeamIds, teamId);
    }

    toggleContactSelection(contactId, ev) {
        ev.stopPropagation();
        this.toggleArrayItem(this.state.selectedPartnerIds, contactId);
    }

    clearTeamFilter(ev) {
        ev.stopPropagation();
        this.state.selectedTeamIds = [];
    }

    clearContactFilter(ev) {
        ev?.stopPropagation();
        this.state.selectedPartnerIds = [];
    }

    // -------------------------------------------------------------------
    // Visibilidad y recorte de tickets dentro del período seleccionado
    // -------------------------------------------------------------------

    getVisibleRange() {
        if (this.state.viewMode === "month") {
            return {
                start: toDateStr(this.state.selectedYear, this.state.selectedMonth, 1),
                end: toDateStr(this.state.selectedYear, this.state.selectedMonth, this.state.days.length),
            };
        }
        return {
            start: this.state.selectedWeekStart,
            end: this.state.days[this.state.days.length - 1].dateStr,
        };
    }

    /** ¿El rango del ticket se solapa con el rango visible actual? */
    isTicketVisibleInSelectedMonth(ticket) {
        const { start, end } = this.getVisibleRange();
        return ticket.start_date <= end && ticket.end_date >= start;
    }

    /** Día relativo (1..N) donde debe empezar la barra visualmente. */
    getTicketDay(ticket) {
        const ticketStart = parseDateStr(ticket.start_date);
        const visibleStart = parseDateStr(this.getVisibleRange().start);
        if (ticketStart < visibleStart) {
            return 1;
        }
        return daysBetween(visibleStart, ticketStart) + 1;
    }

    /** Día relativo (1..N) donde debe terminar la barra visualmente (recortado al rango visible). */
    getTicketEndDay(ticket) {
        const ticketEnd = parseDateStr(ticket.end_date);
        const { start, end } = this.getVisibleRange();
        const visibleStart = parseDateStr(start);
        const visibleEnd = parseDateStr(end);
        const clippedEnd = ticketEnd > visibleEnd ? visibleEnd : ticketEnd;
        return daysBetween(visibleStart, clippedEnd) + 1;
    }

    // -------------------------------------------------------------------
    // Posicionamiento de las barras (Gantt en %)
    // -------------------------------------------------------------------

    getTrackLeft(ticket) {
        const startDay = this.getTicketDay(ticket);
        return ((startDay - 1) / this.state.days.length) * 100;
    }

    getTrackWidth(ticket) {
        const startDay = this.getTicketDay(ticket);
        const endDay = this.getTicketEndDay(ticket);
        return ((endDay - startDay + 1) / this.state.days.length) * 100;
    }

    // -------------------------------------------------------------------
    // Indicador de "hoy"
    // -------------------------------------------------------------------

    get todayStr() {
        return formatDateStr(new Date());
    }

    /** Índice (0-based) del día actual dentro de state.days, o -1 si no es visible. */
    getTodayIndex() {
        return this.state.days.findIndex((d) => d.dateStr === this.todayStr);
    }

    isTodayVisible() {
        return this.getTodayIndex() !== -1;
    }

    getTodayColumnLeft() {
        const index = this.getTodayIndex();
        return index === -1 ? 0 : (index / this.state.days.length) * 100;
    }

    getTodayColumnWidth() {
        return (1 / this.state.days.length) * 100;
    }

    // -------------------------------------------------------------------
    // Organización en carriles ("tracks") para evitar solapes visuales
    // -------------------------------------------------------------------

    /** Tickets de un usuario, visibles en el período actual, filtrados por contacto y ordenados por posición visual. */
    getUserTickets(userId, teamId) {
        return this.state.tickets
            .filter((t) => t.user_id && t.user_id[0] === userId)
            .filter((t) => !teamId || !t.team_id || t.team_id[0] === teamId)
            .filter((t) => this.isTicketVisibleInSelectedMonth(t))
            .filter((t) => !this.state.selectedPartnerIds.length || (t.partner_id && this.state.selectedPartnerIds.includes(t.partner_id[0])))
            .sort((a, b) => {
                const dayA = this.getTicketDay(a);
                const dayB = this.getTicketDay(b);
                return dayA !== dayB ? dayA - dayB : a.start_date.localeCompare(b.start_date);
            });
    }

    /** % de tickets abiertos y cerrados de un usuario, sobre los tickets visibles en el período actual. */
    getUserStatusStats(userId, teamId) {
        const tickets = this.getUserTickets(userId, teamId);
        const total = tickets.length;
        if (total === 0) {
            return { openPct: 0, closedPct: 0, total: 0 };
        }

        const closedCount = tickets.filter((t) => t.closed).length;
        const openCount = total - closedCount;
        return {
            openPct: (openCount / total) * 100,
            closedPct: (closedCount / total) * 100,
            total,
        };
    }

    getClosedTooltip(stats) {
        return sprintf(_t("%s% closed"), Math.round(stats.closedPct));
    }

    getOpenTooltip(stats) {
        return sprintf(_t("%s% open"), Math.round(stats.openPct));
    }

    /**
     * Reparte los tickets de un usuario en carriles ("tracks") para que
     * los que se solapan en el tiempo no se pisen visualmente.
     * Cada ticket se coloca en el PRIMER carril donde quepa sin solaparse
     * con NINGUNO de los tickets ya colocados en ese carril; si no hay
     * ninguno libre, se crea un carril nuevo.
     */
    buildUserTracks(userId, teamId) {
        const tickets = this.getUserTickets(userId, teamId);
        const tracks = [];

        for (const ticket of tickets) {
            const start = this.getTicketDay(ticket);
            const freeTrack = tracks.find((track) =>
                track.tickets.every((t) => this.getTicketEndDay(t) < start)
            );

            if (freeTrack) {
                freeTrack.tickets.push(ticket);
            } else {
                tracks.push({ tickets: [ticket] });
            }
        }

        tracks.forEach((track, index) => {
            track.top = index * TRACK_HEIGHT;
        });
        return tracks;
    }

    /** Alto (px) de la fila de un usuario según cuántos carriles necesita (mínimo 1). */
    getRowHeight(trackCount) {
        return (trackCount || 1) * TRACK_HEIGHT + ROW_BOTTOM_MARGIN;
    }

    // -------------------------------------------------------------------
    // Tooltip de ticket (prioridad en estrellas + posicionamiento arriba/abajo)
    // -------------------------------------------------------------------

    getPriorityStars(priority) {
        const level = parseInt(priority, 10) || 0;
        return [1, 2, 3].map((n) => n <= level);
    }

    /** Decide si el tooltip debe abrirse hacia abajo según el espacio disponible por encima del ticket. */
    onTicketMouseEnter(ev) {
        const ticketEl = ev.currentTarget;
        const tooltipEl = ticketEl.querySelector(".o_helpdesk_owl_calendar_ticket_tooltip");
        const containerEl = this.tableContainerRef.el;
        if (!tooltipEl || !containerEl) {
            return;
        }

        const ticketRect = ticketEl.getBoundingClientRect();
        const containerRect = containerEl.getBoundingClientRect();
        const tooltipHeight = tooltipEl.offsetHeight;
        const tooltipWidth = tooltipEl.offsetWidth;

        const spaceAbove = ticketRect.top - containerRect.top;
        const fitsAbove = spaceAbove >= tooltipHeight + 8;

        tooltipEl.classList.toggle("o_tooltip_below", !fitsAbove);

        // El tooltip se ancla por defecto a la izquierda del ticket (left: 0).
        // Si no cabe hasta el borde derecho del contenedor, lo anclamos por la derecha.
        const spaceRight = containerRect.right - ticketRect.left;
        const fitsRight = spaceRight >= tooltipWidth;
        tooltipEl.classList.toggle("o_tooltip_right", !fitsRight);
    }

    // -------------------------------------------------------------------
    // Acciones (abrir / crear tickets)
    // -------------------------------------------------------------------

    /** Abre el formulario de ticket en un diálogo modal y recarga los datos al cerrarlo. */
    async _openTicketFormAction(actionParams) {
        await this.actionService.doAction({
            type: "ir.actions.act_window",
            res_model: "helpdesk.ticket",
            views: [[false, "form"]],
            target: "new",
            ...actionParams,
        }, {
            onClose: async () => {
                await this.loadUsersAndTickets();
            },
        });
    }

    async openTicketForm(ticket) {
        await this._openTicketFormAction({ res_id: ticket.id });
    }

    async openNewTicketForm(userId, teamId) {
        await this._openTicketFormAction({
            context: {
                default_user_id: userId,
                default_team_id: teamId,
            },
        });
    }

    // -------------------------------------------------------------------
    // Controles de vista, mes y año
    // -------------------------------------------------------------------

    updateDays() {
        if (this.state.viewMode === "month") {
            const { selectedYear: year, selectedMonth: month } = this.state;
            const length = getDaysInMonth(year, month);
            this.state.days = Array.from({ length }, (_, i) => ({
                day: i + 1,
                month,
                year,
                label: i + 1,
                dateStr: toDateStr(year, month, i + 1),
            }));
            this.state.periodLabel = this.months[month]?.name;
        } else {
            const start = parseDateStr(this.state.selectedWeekStart);
            const days = [];
            const current = new Date(start);
            for (let i = 0; i < 7; i++) {
                days.push({
                    day: current.getDate(),
                    month: current.getMonth(),
                    year: current.getFullYear(),
                    label: `${WEEKDAY_NAMES[(current.getDay() + 6) % 7]} ${current.getDate()}`,
                    dateStr: formatDateStr(current),
                });
                current.setDate(current.getDate() + 1);
            }
            this.state.days = days;
            const startLabel = `${days[0].day} ${MONTH_NAMES[days[0].month].slice(0, 3)}`;
            const endLabel = `${days[6].day} ${MONTH_NAMES[days[6].month].slice(0, 3)}`;
            this.state.periodLabel = _t(`Week ${startLabel} - ${endLabel}`);
        }
    }

    onTogglePeriod(mode) {
        this.state.viewMode = mode;
        if (mode === "week") {
            this.state.selectedWeekStart = getWeekStartDate(new Date());
        } else {
            const current = parseDateStr(this.state.selectedWeekStart);
            this.state.selectedMonth = current.getMonth();
            this.state.selectedYear = current.getFullYear();
        }
        this.updateDays();
    }

    /** Desplaza el período actual (semana o mes) "direction" pasos (-1 = anterior, 1 = siguiente). */
    shiftPeriod(direction) {
        if (this.state.viewMode === "month") {
            let month = this.state.selectedMonth + direction;
            let year = this.state.selectedYear;
            if (month < 0) {
                month = 11;
                year -= 1;
            } else if (month > 11) {
                month = 0;
                year += 1;
            }
            this.state.selectedMonth = month;
            this.state.selectedYear = year;
        } else {
            const start = parseDateStr(this.state.selectedWeekStart);
            start.setDate(start.getDate() + direction * 7);
            this.state.selectedWeekStart = formatDateStr(start);
        }
        this.updateDays();
    }

    onPrevPeriod() {
        this.shiftPeriod(-1);
    }

    onNextPeriod() {
        this.shiftPeriod(1);
    }

    onMonthChange(ev) {
        this.state.selectedMonth = parseInt(ev.target.value, 10);
        if (this.state.viewMode === "month") {
            this.updateDays();
        }
    }

    onYearChange(ev) {
        this.state.selectedYear = parseInt(ev.target.value, 10) || this.state.selectedYear;
        if (this.state.viewMode === "month") {
            this.updateDays();
        }
    }
}

HelpdeskCalendar.template = "helpdesk_mgmt_team_overview.CalendarView";
registry.category("actions").add("helpdesk_mgmt_team_overview.action_calendar_js", HelpdeskCalendar);
