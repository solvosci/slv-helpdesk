# © 2026 Solvos Consultoría Informática (<https://www.solvos.es>)
# License AGPL-3.0 (https://www.gnu.org/licenses/agpl-3.0.html)

from odoo import api, fields, models


SECURITY_ISSUE_LEVELS = [
    ("critical", "Critical"),
    ("very_high", "Very High"),
    ("high", "High"),
    ("medium", "Medium"),
    ("low", "Low"),
    ("wo_impact", "Without Impact"),
]


class HelpdeskTicket(models.Model):
    _inherit = "helpdesk.ticket"

    danger_level = fields.Selection(selection=SECURITY_ISSUE_LEVELS)
    impact = fields.Selection(selection=SECURITY_ISSUE_LEVELS)

    is_security_issue = fields.Boolean(
        related="type_id.security_issue",
    )

    @api.onchange("type_id")
    def _onchange_type_id_security(self):
        # This could be a compute stored editable file, but this code is
        #  more compatible with 12.0
        if not self.is_security_issue:
            self.update({
                "danger_level": False,
                "impact": False,
            })
