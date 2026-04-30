# © 2026 Solvos Consultoría Informática (<https://www.solvos.es>)
# License AGPL-3.0 (https://www.gnu.org/licenses/agpl-3.0.html)

from odoo import _, fields, models


class HelpdeskTicketType(models.Model):
    _inherit = "helpdesk.ticket.type"

    security_issue = fields.Boolean(
        string="Used to register security issues",
    )
