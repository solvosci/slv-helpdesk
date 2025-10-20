# -*- coding: utf-8 -*-
# © 2025 Solvos Consultoría Informática (<http://www.solvos.es>)
# License AGPL-3 - See http://www.gnu.org/licenses/agpl-3.0.html

from odoo.tests import common
from odoo.tests.common import new_test_user, users, tagged
from odoo.fields import Command


@tagged('related2')
class TestHelpdeskRelatedUsers(common.TransactionCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.partner = cls.env["res.partner"].create({"name": "Mr Odoo"})
        cls.user = new_test_user(
            cls.env, login="u1", name="Helpdesk User 1", groups="helpdesk_mgmt.group_helpdesk_user,sales_team.group_sale_salesman",
        )
        cls.user2 = new_test_user(
            cls.env, login="u2", name="Helpdesk User 2", groups="helpdesk_mgmt.group_helpdesk_user,sales_team.group_sale_salesman",
        )
        cls.user3 = new_test_user(
            cls.env, login="u3", name="Helpdesk User 3", groups="helpdesk_mgmt.group_helpdesk_user,sales_team.group_sale_salesman",
        )
        cls.user4 = new_test_user(
            cls.env, login="u4", name="Helpdesk User 4", groups="helpdesk_mgmt.group_helpdesk_user,sales_team.group_sale_salesman",
        )
        cls.team_a = cls.env["helpdesk.ticket.team"].create({"name": "Team A", "user_ids" : [cls.user.id, cls.user2.id, cls.user3.id]})
        cls.team_b = cls.env["helpdesk.ticket.team"].create({"name": "Team B", "user_ids" : [cls.user2.id]})
        cls.ticket = cls.env["helpdesk.ticket"].create(
            {
                "name": "Test ticket",
                "partner_id": cls.partner.id,
                "user_id": cls.user.id,
                "team_id": cls.team_a.id,
                "description": "Test description",
            }
        )

    @users("u1")
    def test_valid_related_when_in_team(self):
        self.ticket.write({"related_user_ids": [Command.set([self.user2.id])]})
        self.assertEqual(self.ticket.related_user_ids, self.user2)

    @users("u1")
    def test_compute_clears_when_no_team(self):
        self.ticket.write({"related_user_ids": [Command.set([self.user2.id])]})
        self.ticket.write({"team_id": False})
        self.env.flush_all(); self.env.invalidate_all()
        self.assertFalse(self.ticket.related_user_ids)

    @users("u1")
    def test_compute_intersects_on_team_change(self):
        self.ticket.write(
            {"team_id": self.team_a.id, "related_user_ids": [Command.set([self.user2.id, self.user3.id])]}
        )
        self.ticket.write({"team_id": self.team_b.id})
        self.env.flush_all(); self.env.invalidate_all()
        self.assertEqual(set(self.ticket.related_user_ids.ids), {self.user2.id})
