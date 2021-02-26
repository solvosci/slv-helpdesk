# © 2021 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html
from odoo import fields, models


class HelpdeskType(models.Model):
    _inherit = "helpdesk.ticket.type"

    reminder_active = fields.Boolean(string='Reminder include', default=True)
