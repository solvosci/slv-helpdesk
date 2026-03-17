# © 2026 Solvos Consultoría Informática (<http://www.solvos.es>)
# License AGPL-3 - See http://www.gnu.org/licenses/agpl-3.0.html

from odoo import models


class HelpdeskTicket(models.Model):
    _inherit = "helpdesk.ticket"

    def portal_should_hide_composer(self):
        self.ensure_one()
        return (
            self.company_id.helpdesk_mgmt_portal_no_msgs_close_ticket
            and self.closed
        )
