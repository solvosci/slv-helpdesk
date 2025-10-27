from odoo import fields, models


class HelpdeskTicketCategory(models.Model):
    _inherit = "helpdesk.ticket.category"

    default_partner_id = fields.Many2one(
        comodel_name="res.users",
        string="Default Assigned Portal User",
        domain=[("share", "=", False)],
    )
