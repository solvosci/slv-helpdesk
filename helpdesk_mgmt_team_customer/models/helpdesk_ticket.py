#    Copyright (C) 2024 Solvos Consultoría Informática <www.solvos.es>
# License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).
from odoo import models,fields, api

class HelpdeskTicket(models.Model):
    _inherit="helpdesk.ticket"

    partner_id=fields.Many2one(
        comodel_name="res.partner",
        domain="[('is_company', '=' , True)]"
    )

    default_partner_id=fields.Many2one(
        comodel_name="res.partner",
        domain="[('is_company', '=' , True)]"
    )

    allowed_partner_ids = fields.Many2many(
        comodel_name="res.partner",
        related="team_id.allowed_partner_ids",
        readonly=True
    )

    @api.onchange('team_id')
    def _onchange_team_id(self):
        if self.team_id.default_partner_id:
            self.partner_id = self.team_id.default_partner_id
            self.default_partner_id = self.team_id.default_partner_id
