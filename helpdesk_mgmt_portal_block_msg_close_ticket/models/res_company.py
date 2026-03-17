# © 2026 Solvos Consultoría Informática (<http://www.solvos.es>)
# License AGPL-3 - See http://www.gnu.org/licenses/agpl-3.0.html

from odoo import fields, models


class Company(models.Model):
    _inherit = "res.company"

    helpdesk_mgmt_portal_no_msgs_close_ticket = fields.Boolean(
        string="Block send messages on closed tickets In Helpdesk portal"
    )
