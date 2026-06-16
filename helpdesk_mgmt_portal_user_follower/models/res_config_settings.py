# © 2026 Solvos Consultoría Informática (<http://www.solvos.es>)
# License AGPL-3 - See http://www.gnu.org/licenses/agpl-3.0.html

from odoo import models, fields


class ResCompany(models.Model):
    _inherit = 'res.company'

    helpdesk_show_portal_users = fields.Boolean(
        string="Show Portal Users in Helpdesk Tickets",
    )


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    helpdesk_show_portal_users = fields.Boolean(
        string="Show Portal Users in Helpdesk Tickets",
        related='company_id.helpdesk_show_portal_users',
        readonly=False,
    )
