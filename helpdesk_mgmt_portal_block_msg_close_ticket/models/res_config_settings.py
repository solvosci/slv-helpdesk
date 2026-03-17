# © 2026 Solvos Consultoría Informática (<http://www.solvos.es>)
# License AGPL-3 - See http://www.gnu.org/licenses/agpl-3.0.html

from odoo import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    helpdesk_mgmt_portal_no_msgs_close_ticket = fields.Boolean(
        related="company_id.helpdesk_mgmt_portal_no_msgs_close_ticket",
        readonly=False,
    )
