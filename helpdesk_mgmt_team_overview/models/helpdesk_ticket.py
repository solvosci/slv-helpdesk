from odoo import fields, models, _


class HelpdeskTicket(models.Model):
    _inherit = "helpdesk.ticket"

    start_date = fields.Date(
        string="Start Date"
    )
    end_date = fields.Date(
        string="End Date"
    )
    extra_objetive = fields.Boolean()

    _sql_constraints = [
        (
            "valid_dates",
            _("CHECK (start_date <= end_date)"),
            "The start date must be earlier than or equal to the end date.",
        )
    ]
