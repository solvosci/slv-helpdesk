# © 2020 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html
from odoo import _, fields, models, api

import datetime


class HelpdeskTicket(models.Model):
    _inherit = "helpdesk.ticket"

    reminder_active = fields.Boolean(string='Reminder include', default=True)

    @api.model
    def _send_activity_reminder_all(self):
        # This process is skipped on weekend
        if fields.datetime.now().weekday() in (5, 6):
            return
        reminder_date = fields.datetime.now() - datetime.timedelta(days=7)
        tickets = self.search([
            ('stage_id.closed', '=', False),
            ('reminder_active', '=', True),
            ('write_date', '<=', reminder_date)])
        # TODO test data
        # tickets = self.browse([1869, 1870])
        if tickets:
            tickets._send_activity_reminder()
            tickets._update_activity_reminder()

    def _send_activity_reminder(self):
        # Standard email notification
        # TODO res_config_settings parameter
        Template = self.env.ref(
            "helpdesk_mgmt_ticket_reminder.email_template_ticket_reminder")
        for ticket in self:
            Template.send_mail(ticket.id, force_send=True)

    def _update_activity_reminder(self):
        for ticket in self:
            # TODO dummy write_date update
            ticket.write({
                "description": ticket.description + \
                    _("<p>Reminder sent on %s</p>") % fields.date.today()})
