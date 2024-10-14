#    Copyright (C) 2024 Solvos Consultoría Informática <www.solvos.es>
# License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).
from odoo import models, fields

class HelpdeskTicketTeam(models.Model):
    _inherit="helpdesk.ticket.team"

    default_partner_id=fields.Many2one(
        comodel_name="res.partner",
        string="Default partner"
    )
