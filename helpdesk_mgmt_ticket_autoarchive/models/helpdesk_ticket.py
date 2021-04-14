# © 2021 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html
from odoo import models
import datetime


class HelpdeskTicket(models.Model):
    _inherit = 'helpdesk.ticket'

    def autoarchive_tickets(self):
        res_company = self.env['res.company'].sudo().search([])

        for company in res_company.filtered(
            lambda x: x.autoarchive_tickets > 0
        ):

            interval_number = company.autoarchive_tickets
            autoarchive_days = datetime.timedelta(days=interval_number)
            date_archive = datetime.datetime.now() - autoarchive_days

            closed = self.sudo().search([
                ("stage_id.closed", "=", True),
                ("closed_date", "<=", date_archive),
                ("company_id", "=", company.id),
            ])
            if closed:
                closed.write({"active": False})
