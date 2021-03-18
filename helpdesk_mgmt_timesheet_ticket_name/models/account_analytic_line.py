# © 2021 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html

from odoo import fields, models
   
    
class AccountAnalyticLine(models.Model):
    _inherit = 'account.analytic.line'

    ticket_complete_name = fields.Char(
        related='ticket_id.complete_name',
        store=True,
        index=True,
    )
    ticket_name = fields.Char(
        related='ticket_id.name'
    )
