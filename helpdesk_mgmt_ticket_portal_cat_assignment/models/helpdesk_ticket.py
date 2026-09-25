from odoo import api, models


class HelpdeskTicket(models.Model):
    _inherit = "helpdesk.ticket"

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if self.env.user.share and vals.get("category_id"):
                category = self.env["helpdesk.ticket.category"].browse(
                    vals["category_id"]
                )
                if (
                    category.default_partner_id
                    and not self.env.company.helpdesk_mgmt_portal_select_team
                ):
                    vals["user_id"] = category.default_partner_id.id
                else:
                    if vals.get("team_id"):
                        team = self.env["helpdesk.ticket.team"].browse(vals["team_id"])
                        if team and category.default_partner_id in team.user_ids:
                            vals["user_id"] = category.default_partner_id.id
                        elif team and team.user_id:
                            vals["user_id"] = team.user_id.id

        return super().create(vals_list)
