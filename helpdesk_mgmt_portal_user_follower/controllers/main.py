# © 2026 Solvos Consultoría Informática (<http://www.solvos.es>)
# License AGPL-3 - See http://www.gnu.org/licenses/agpl-3.0.html

from odoo import http
from odoo.http import request
from odoo.addons.helpdesk_mgmt.controllers.main import HelpdeskTicketController


class HelpdeskTicketController(HelpdeskTicketController):

    @http.route("/submitted/ticket", type="http", auth="user", website=True, csrf=True)
    def submit_ticket(self, **kw):
        res = super().submit_ticket(**kw)

        ticket_id = int(res.location.split("/")[-1])
        new_ticket = request.env["helpdesk.ticket"].browse(ticket_id)

        user_ids = request.httprequest.form.getlist("portal_user_ids[]")

        if user_ids:
            user_ids = [int(uid) for uid in user_ids]
            users = request.env["res.users"].browse(user_ids)

            partner_ids = users.sudo().mapped("partner_id").ids
            new_ticket.sudo().message_subscribe(partner_ids=partner_ids)

        return res
