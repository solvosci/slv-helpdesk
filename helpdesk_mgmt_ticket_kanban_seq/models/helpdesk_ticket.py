# © 2021 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html
from odoo import _, fields, models, api


class HelpdeskTicket(models.Model):
    _inherit = "helpdesk.ticket"
    _order = "priority desc, sequence, number desc"

    sequence = fields.Integer(
        default=10,
        help="Gives the sequence order when displaying a list of tickets."
    )
