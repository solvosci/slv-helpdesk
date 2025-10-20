# © 2025 Solvos Consultoría Informática (<http://www.solvos.es>)
# License AGPL-3 - See http://www.gnu.org/licenses/agpl-3.0.html

from odoo import api, fields, models, Command


class HelpdeskTicket(models.Model):
    _inherit = 'helpdesk.ticket'

    related_user_ids = fields.Many2many(
        'res.users',
        'helpdesk_ticket_related_user_rel',
        'ticket_id', 'user_id',
        string='Related Users',
        domain="team_id and ['&','&', ('id','!=', user_id), ('share','=',False), ('id','in', user_ids)] or [('id','=',False)]",
        help='Users involved but not assigned',
        compute="_compute_related_user_ids",
        readonly=False,
        store=True
    )

    @api.depends('team_id', 'user_ids')
    def _compute_related_user_ids(self):
        for record in self:
            if record.team_id:
                record.related_user_ids = record.related_user_ids & record.user_ids
            else:
                record.related_user_ids = False

    @api.onchange('user_id')
    def _onchange_user_id_add_previous_to_related(self):
        for record in self:
            old_user = record._origin.user_id
            new_user = record.user_id
            related_changes = []
            if old_user and old_user != new_user:
                related_changes.append(Command.link (old_user.id))
            if new_user:
                related_changes.append(Command.unlink (new_user.id))
            record.related_user_ids = related_changes
            record._origin.user_id = new_user

    def _subscribe_related_users(self):
        for ticket in self:
            partners = ticket.related_user_ids.mapped('partner_id')
            if partners:
                ticket.message_subscribe(partner_ids=partners.ids)

    @api.model_create_multi
    def create(self, vals):
        res = super().create(vals)
        for record in res.filtered(lambda x: x.related_user_ids):
            record._subscribe_related_users()
        return res

    def write(self, vals):
        res = super().write(vals)

        if 'related_user_ids' in vals or 'user_id' in vals:
            self._subscribe_related_users()

        return res
