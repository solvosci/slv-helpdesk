# © 2021 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html
from odoo import api, fields, models


class AccountAnalyticLine(models.Model):
    _inherit = "account.analytic.line"

    # New group must be added to the following fields, because we couldn't 
    #  insert our custom group into the current helpdesk grouping hierarchy
    ticket_id = fields.Many2one(
        groups="helpdesk_mgmt.group_helpdesk_user,helpdesk_mgmt_timesheet_readonly.group_helpdesk_timesheet_readonly"
    )
    ticket_partner_id = fields.Many2one(
        groups="helpdesk_mgmt.group_helpdesk_user,helpdesk_mgmt_timesheet_readonly.group_helpdesk_timesheet_readonly"
    )
