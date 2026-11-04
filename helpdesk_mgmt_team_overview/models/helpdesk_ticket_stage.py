from odoo import fields, models


class HelpdeskTicketStage(models.Model):
    _inherit = "helpdesk.ticket.stage"

    default_filter_calendar = fields.Boolean()
    color = fields.Integer()
