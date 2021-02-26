# © 2021 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html
from odoo import fields, models, api
   
    
class HelpdeskTicket(models.Model):
    _inherit = "helpdesk.ticket"
      
    @api.onchange('type_id')
    def _onchange_type_id(self):
        if self.type_id:
            self.reminder_active = self.type_id.reminder_active
