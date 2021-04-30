# © 2021 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html
from odoo import fields, models, api, _
from odoo.exceptions import ValidationError
import datetime


class HelpdeskTicketStage(models.Model):
    _inherit = "helpdesk.ticket.stage"

    auto_stage = fields.Boolean(default=False)
    destination_stage = fields.Many2one("helpdesk.ticket.stage")
    inactivity_time = fields.Integer(
        string="Inactivity time for stage change(Days)",
        default=1
    )

    @api.onchange('auto_stage')
    def _onchange_auto_stage(self):
        if not self.auto_stage:
            self.destination_stage = False
            self.inactivity_time = False
        else:
            self.inactivity_time = 1

    @api.onchange('destination_stage')
    def _onchange_destination_stage(self):
        if self.auto_stage and self.destination_stage.id == self._origin.id:
            raise ValidationError(_(
                "Wrong value for Destination Stage:"
                " It cannot be the same stage!"
            ))

    @api.onchange('inactivity_time')
    def _onchange_inactivity_time(self):
        if self.auto_stage and self.inactivity_time <= 0:
            raise ValidationError(_(
                "Wrong value for Inactivity Time:"
                " Must be positive!"
            ))


class HelpdeskTicket(models.Model):
    _inherit = "helpdesk.ticket"

    def auto_stage_tickets(self):

        for ticket in self.search([("stage_id.auto_stage", "=", True)]):
            interval_number = ticket.stage_id.inactivity_time
            stage_days = datetime.timedelta(days=interval_number)
            date_stage = datetime.datetime.now()
            if (ticket.last_timesheet_activity):
                last_timesheet = datetime.datetime.combine(
                    ticket.last_timesheet_activity,
                    datetime.time(date_stage.hour, date_stage.minute)
                )
                last_update = max(ticket.last_stage_update,
                                  last_timesheet)
            else:
                last_update = ticket.last_stage_update
            last_update = last_update + stage_days

            if last_update <= date_stage:
                stage_ticket = ticket.stage_id.destination_stage.id
                ticket.write({
                    "stage_id": stage_ticket
                })
