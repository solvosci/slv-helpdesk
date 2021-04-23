# © 2021 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html

from odoo import models, _


class HelpdeskTicket(models.Model):
    _inherit = 'helpdesk.ticket'

    def massive_assignment(self):
        Wizard = self.env['helpdesk.ticket.assignment.massive.wizard']
        new = Wizard.create({
            'ticket_ids': [(6, False, self._context['active_ids'])]
        })
        return {
            'name': _('Assignment Massive'),
            'res_model': 'helpdesk.ticket.assignment.massive.wizard',
            'view_mode': 'form',
            'view_type': 'form',
            'res_id': new.id,
            'target': 'new',
            'type': 'ir.actions.act_window'
        }
