# © 2021 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html
from odoo import _, api, fields, models
from odoo.exceptions import ValidationError


class ResCompany(models.Model):
    _inherit = 'res.company'

    autoarchive_tickets = fields.Integer(
        string='Days to archive ticket',
        default=0,
        help="If 0 is filled, this functionality will be disabled"
    )

    @api.constrains("autoarchive_tickets")
    def _check_autoarchive_tickets(self):
        self.ensure_one()
        if self.autoarchive_tickets < 0:
            raise ValidationError(_(
                "Wrong value for Days to archive ticket:"
                " it cannot be negative!"
            ))
