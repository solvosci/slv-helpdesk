# © 2026 Solvos Consultoría Informática (<http://www.solvos.es>)
# License AGPL-3 - See http://www.gnu.org/licenses/agpl-3.0.html

from odoo import models, api, fields
import ast


class MailComposer(models.TransientModel):
    _inherit = "mail.compose.message"

    custom_dest_partner_ids = fields.Many2many(
        'res.partner',
        relation='mail_compose_message_res_partner_delete',
        compute='_compute_custom_dest_partner_ids',
        readonly=False,
        store=True,
        string="End recipients"
    )

    @api.depends("model", "res_ids")
    def _compute_custom_dest_partner_ids(self):
        for compose in self:
            if compose.model == 'helpdesk.ticket' and compose.res_ids:
                res_ids = ast.literal_eval(compose.res_ids) # '[9]' --> [9]

                record = self.env[compose.model].browse(res_ids)
                compose.custom_dest_partner_ids = record.mapped('message_partner_ids') - compose.author_id

    def _action_send_mail(self, auto_commit=False):
        result_mails_su, result_messages = super()._action_send_mail(auto_commit=False)
        result_messages.mail_ids.recipient_ids = self.custom_dest_partner_ids
        return result_mails_su, result_messages
