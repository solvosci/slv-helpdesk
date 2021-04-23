# © 2021 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html

from odoo import fields, models, api, _
from odoo.exceptions import ValidationError


class AssignmentMassive(models.TransientModel):
    _name = 'helpdesk.ticket.assignment.massive.wizard'

    ticket_ids = fields.Many2many(
        'helpdesk.ticket',
        string='Selected tickets',
        readonly=True
    )
    user_id = fields.Many2one('res.users', string='Assigned user')
    stage_id = fields.Many2one('helpdesk.ticket.stage', string='Stage')

    def assigned_user(self):
        for ticket in self.ticket_ids:
            if self.user_id:
                if ticket.team_id and \
                   self.user_id.id not in ticket.team_id.user_ids.ids:
                    raise ValidationError(_(
                        'In ticket %s the assigned user %s '
                        'is not associated with team %s'
                    ) % (ticket.number, self.user_id.name,
                         ticket.team_id.name)
                    )

            ticket.write({"user_id": self.user_id.id or False})

            if self.stage_id:
                ticket.write({
                    'stage_id': self.stage_id.id
                })

        return {
            'type': 'ir.actions.client',
            'tag': 'reload',
        }
