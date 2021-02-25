# © 2020 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html
from odoo import fields, models, api

import datetime


class HelpdeskTicket(models.Model):
    _inherit = "helpdesk.ticket"

    start_date = fields.Datetime(track_visibility="onchange")
    
    @api.model
    def create(self, vals):
        res = super().create(vals)
        if not res.start_date:
            res.start_date = res.create_date

        return res
