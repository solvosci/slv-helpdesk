# © 2021 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html
from odoo import models, api


class AccountAnalyticLine(models.Model):
    _inherit = "account.analytic.line"

    @api.multi
    def report_custom_order(self):
        order = self.env['helpdesk.ticket']._order
        orders = order.split(", ")
        orders.reverse()
        sort_timesheet = self
        for field in orders:
            field = field.split(" ")
            if len(field) > 1:
                sort_timesheet = sort_timesheet.sorted(
                    key=lambda r: r.ticket_id[field[0]], reverse=True)
            else:
                sort_timesheet = sort_timesheet.sorted(
                    key=lambda r: r.ticket_id[field[0]])

        return sort_timesheet
