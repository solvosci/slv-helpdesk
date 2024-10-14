#    Copyright (C) 2024 Solvos Consultoría Informática <www.solvos.es>
# License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).
from odoo import models, api

class HelpdeskTicket(models.Model):
    _inherit="helpdesk.ticket"

    @api.onchange('team_id')
    def _onchange_team_id(self):
        if self.team_id.default_partner_id:
            self.partner_id = self.team_id.default_partner_id
