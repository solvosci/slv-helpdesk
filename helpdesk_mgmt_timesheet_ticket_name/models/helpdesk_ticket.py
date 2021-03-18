# © 2021 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html

from odoo import api, fields, models


class HelpdeskTicket(models.Model):
    _inherit = 'helpdesk.ticket'

    complete_name = fields.Char(string="Ticket", 
                                compute="_compute_complete_name", store=True)
    
    @api.depends('number', 'name')
    def _compute_complete_name(self):
        
        def format_name(name, size):
            if (len(name) >= size):
                name = name[:size] + "..."
            return name
        
        for ticket in self:
            ticket.complete_name = "%s - %s" % (ticket.number, 
                                                format_name(ticket.name, 50))
