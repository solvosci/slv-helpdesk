# © 2021 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html
from odoo import _, fields, models, api
import datetime


class HelpdeskTicketStage(models.Model):
    _inherit = "helpdesk.ticket.stage"

    auto_stage = fields.Boolean(default=False)
    destination_stage = fields.Many2one('helpdesk.ticket.stage')
    inactivity_time = fields.Integer(
        string='Inactivity time for stage change(Days)'
    )


class HelpdeskTicket(models.Model):
    _inherit = "helpdesk.ticket"

    def auto_stage_tickets(self):
        helpdesk_ticket = self.env['helpdesk.ticket'].sudo().search([('stage_id.auto_stage', '=', True)])

        for ticket in helpdesk_ticket:
            interval_number = ticket.stage_id.inactivity_time
            stage_days = datetime.timedelta(days=interval_number)
            last_update = max(ticket.last_stage_update, ticket.last_timesheet_activity)
            date_stage = last_update + stage_days

            if date_stage > datetime.datetime.now():
                stage_ticket = ticket.stage_id.destination_stage.id
                ticket.write({
                    "stage_id": stage_ticket
                })
