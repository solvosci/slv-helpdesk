# © 2021 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html
from odoo import fields, models, api


class AccountAnalyticLine(models.Model):
    _inherit = "account.analytic.line"

    @api.multi
    def report_sorted(self):
        sort_timesheet = self.sorted(
            key=lambda r: r.ticket_id.number, reverse=True)
        sort_timesheet = sort_timesheet.sorted(
            key=lambda r: r.ticket_id.sequence)

        return sort_timesheet.sorted(
            key=lambda r: r.ticket_id.priority, reverse=True)
