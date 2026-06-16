# © 2026 Solvos Consultoría Informática (<http://www.solvos.es>)
# License AGPL-3 - See http://www.gnu.org/licenses/agpl-3.0.html
{
    "name": "Helpdesk Ticket Portal User Follower",
    "summary": """
        Add new multiple selection users field on portal users when creating a new ticket.
        The selected users are added as followers on the ticket.
    """,
    "author": "Solvos",
    "license": "AGPL-3",
    "version": "17.0.1.1.0",
    'category': "Helpdesk",
    "website": "https://github.com/solvosci/slv-helpdesk",
    "depends": ["helpdesk_mgmt"],
    "data": [
        "views/helpdesk_ticket_template_views.xml",
        "views/res_config_settings_views.xml",
    ],
    "assets": {
        "web.assets_frontend": [
            "helpdesk_mgmt_portal_user_follower/static/src/js/follower_field.js",
        ],
    },
    "installable": True,
}
