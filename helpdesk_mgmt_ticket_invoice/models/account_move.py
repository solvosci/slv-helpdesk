# © 2024 Solvos Consultoría Informática (<http://www.solvos.es>)
# License AGPL-3 - See http://www.gnu.org/licenses/lgpl-3.0.html

from odoo import fields, models


class AccountMove(models.Model):
    _inherit = "account.move"

    ticket_ids = fields.One2many("helpdesk.ticket","invoice_id")
    count_ticket_ids = fields.Integer(compute="_compute_count_ticket_ids")

    def _compute_count_ticket_ids(self):
        for record in self:
            record.count_ticket_ids = len(record.ticket_ids)

    def action_view_tickets(self):
        action = {
            'name': 'Tickets',
            'res_model': 'helpdesk.ticket',
            'type': 'ir.actions.act_window',
        }
        if self.count_ticket_ids == 1:
            action['view_mode'] = 'form'
            action['res_id'] = self.ticket_ids.id
        else:
            action['view_mode'] = 'tree,form'
            action['domain'] = [('invoice_id', "=", self.id)]
        return action

    def create_ticket(self):
        action = self.env.ref("helpdesk_mgmt_ticket_invoice.helpdesk_ticket_action_form").read()[0]
        action['context'] = {
            'default_partner_id': self.partner_id.id,
            'default_ticket_invoice_id': self.id
        }

        return action
