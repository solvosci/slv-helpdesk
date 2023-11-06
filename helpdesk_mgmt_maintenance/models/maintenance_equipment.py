# © 2023 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See http://www.gnu.org/licenses/lgpl-3.0.html

from odoo import fields, models

class MaintenanceEquipment(models.Model):
    _inherit = "maintenance.equipment"

    ticket_ids = fields.Many2many('helpdesk.ticket', string="Tickets")

    allow_ticket = fields.Boolean(string="Allow Tickets", default=False)

    # NUMBERS TICKETS COMPUTE NO STORE

    ticket_count = fields.Integer(string="Number Tickets", compute="_compute_new_ticket_count")

    def _compute_new_ticket_count(self):
        number_tickets = self.env["helpdesk.ticket"].read_group(
            [("equipment_ids", "in", self.ids)],
            ["equipment_ids"],
            ["equipment_ids"]
        )
        result = {
            data["equipment_ids"][0]:data["equipment_ids_count"]
            for data in number_tickets
        }
        for equipment in self:
            equipment.ticket_count = result.get(equipment.id,0)

    def action_view_tickets_equipment(self):
        action = {
            'name':('Tickets'),
            'res_model': 'helpdesk.ticket', 
            'view_mode': 'tree,form',
            'type': 'ir.actions.act_window',
            'domain':  [('id', 'in', self.ticket_ids.ids)],
            'context': {
                'default_equipment_ids': [(4, self.id)],
            },
        }
        return action
