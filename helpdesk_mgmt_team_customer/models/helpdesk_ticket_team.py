#    Copyright (C) 2024 Solvos Consultoría Informática <www.solvos.es>
# License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).
from odoo import api, models, fields

class HelpdeskTicketTeam(models.Model):
    _inherit="helpdesk.ticket.team"

    default_partner_id=fields.Many2one(
        comodel_name="res.partner",
    )

    is_unique_partner=fields.Boolean()

    allowed_partner_ids=fields.Many2many(
        comodel_name="res.partner",
    )

    @api.onchange('default_partner_id')
    def _onchange_default_partner_id(self):
        if not self.default_partner_id:
            self.is_unique_partner = False
