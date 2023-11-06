# © 2023 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See http://www.gnu.org/licenses/lgpl-3.0.html

from odoo import api, fields, models

class HelpdeskTicket(models.Model):
    _inherit = "helpdesk.ticket"

    equipment_ids = fields.Many2many('maintenance.equipment', string= "Equipments")

    has_equipment = fields.Boolean(string="Has Equipment", store=True, compute="_compute_has_equipment")
    
    @api.depends("equipment_ids")
    def _compute_has_equipment(self):
        for ticket in self:
            ticket.has_equipment = bool(ticket.equipment_ids)
