# © 2025 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html
from odoo import models, api


class HelpdeskTicketTeam(models.Model):
    _inherit = 'helpdesk.ticket.team'

    @api.model_create_multi
    def create(self, vals_list):
        self.clear_caches()
        return super().create(vals_list)

    def write(self, vals):
        ret = super().write(vals)
        if "user_ids" in vals:
            self.clear_caches()
        return ret
