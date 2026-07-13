# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).
from odoo.fields import Command
from odoo.tests.common import new_test_user, tagged

from odoo.addons.base.tests.common import HttpCaseWithUserPortal


@tagged("default_partner")
class TestHelpdeskPortalUserAssignment(HttpCaseWithUserPortal):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()

    def test_portal_ticket_user_assignment_logic(self):
        portal_user = new_test_user(
            self.env,
            login="test_portal_user",
            groups="base.group_portal",
        )
        default_user = self.env["res.users"].create(
            {
                "name": "Default User",
                "login": "default_user",
                "email": "default@example.com",
                "groups_id": [
                    Command.set([self.env.ref("helpdesk_mgmt.group_helpdesk_user").id])
                ],
            }
        )
        category_with_default = self.env["helpdesk.ticket.category"].create(
            {
                "name": "Category with Default Partner",
                "default_partner_id": default_user.id,
            }
        )
        ticket_with_default_user = (
            self.env["helpdesk.ticket"]
            .with_user(portal_user)
            .sudo()
            .create(
                {
                    "name": "Ticket with default user",
                    "category_id": category_with_default.id,
                    "description": "",
                }
            )
        )
        category_without_default = self.env["helpdesk.ticket.category"].create(
            {
                "name": "Category without default user",
            }
        )
        ticket_without_default_user = (
            self.env["helpdesk.ticket"]
            .with_user(portal_user)
            .sudo()
            .create(
                {
                    "name": "Ticket without default user",
                    "category_id": category_without_default.id,
                    "description": "",
                }
            )
        )
        self.assertEqual(
            ticket_with_default_user.user_id,
            default_user,
            "Ticket should be assigned to the default user.",
        )

        self.assertEqual(
            ticket_without_default_user.user_id,
            portal_user,
            "Ticket should be assigned to the portal user.",
        )

        ticket_by_internal_user = (
            self.env["helpdesk.ticket"]
            .with_user(default_user)
            .create(
                {
                    "name": "Ticket by internal user",
                    "category_id": category_with_default.id,
                    "description": "",
                }
            )
        )
        self.assertEqual(
            ticket_by_internal_user.user_id,
            default_user,
            "Ticket should be assigned to the internal user.",
        )

        self.env.company.helpdesk_mgmt_portal_select_team = True
        ticket_with_option_enabled = (
            self.env["helpdesk.ticket"]
            .with_user(portal_user)
            .sudo()
            .create(
                {
                    "name": "Ticket with portal team option enabled",
                    "category_id": category_with_default.id,
                    "description": "",
                }
            )
        )
        self.assertEqual(
            ticket_with_option_enabled.user_id,
            portal_user,
            "Ticket should be assigned to the portal user",
        )

        self.env.company.helpdesk_mgmt_portal_select_team = True

        team_leader_a = self.env["res.users"].create(
            {
                "name": "Team Leader A",
                "login": "team_leader_a",
                "email": "leader_a@example.com",
                "groups_id": [
                    Command.set([self.env.ref("helpdesk_mgmt.group_helpdesk_user").id])
                ],
            }
        )
        team_a = self.env["helpdesk.ticket.team"].create(
            {
                "name": "Support Team A",
                "user_id": team_leader_a.id,
                "user_ids": [Command.set([team_leader_a.id, default_user.id])],
            }
        )
        ticket_with_team_default_in = (
            self.env["helpdesk.ticket"]
            .with_user(portal_user)
            .sudo()
            .create(
                {
                    "name": "Ticket with team (default in team)",
                    "category_id": category_with_default.id,
                    "team_id": team_a.id,
                    "description": "",
                }
            )
        )
        self.assertEqual(
            ticket_with_team_default_in.user_id,
            default_user,
            "When portal team selection is enabled and category default user "
            "is in the team, ticket should be assigned to that default user.",
        )

        team_leader_b = self.env["res.users"].create(
            {
                "name": "Team Leader B",
                "login": "team_leader_b",
                "email": "leader_b@example.com",
                "groups_id": [
                    Command.set([self.env.ref("helpdesk_mgmt.group_helpdesk_user").id])
                ],
            }
        )
        team_b = self.env["helpdesk.ticket.team"].create(
            {
                "name": "Support Team B",
                "user_id": team_leader_b.id,
                "user_ids": [Command.set([team_leader_b.id])],
            }
        )
        ticket_with_team_default_out = (
            self.env["helpdesk.ticket"]
            .with_user(portal_user)
            .sudo()
            .create(
                {
                    "name": "Ticket with team (default not in team)",
                    "category_id": category_with_default.id,
                    "team_id": team_b.id,
                    "description": "",
                }
            )
        )
        self.assertEqual(
            ticket_with_team_default_out.user_id,
            team_leader_b,
            "When portal team selection is enabled and category default user is "
            "NOT in the team, ticket should be assigned to the team leader.",
        )
