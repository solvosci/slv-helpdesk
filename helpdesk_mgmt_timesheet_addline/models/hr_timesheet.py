# © 2021 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html
from odoo import models


class AccountAnalyticLine(models.Model):
    _inherit = 'account.analytic.line'

    def create_timesheet(self):
        self.ensure_one()

        # TODO If this function could be skipped, remove it
        return {'type': 'ir.actions.act_window_close'}
