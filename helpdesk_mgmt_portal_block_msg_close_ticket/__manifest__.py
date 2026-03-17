# © 2026 Solvos Consultoría Informática (<http://www.solvos.es>)
# License AGPL-3 - See http://www.gnu.org/licenses/agpl-3.0.html
{
    "name": "Helpdesk Portal Block Message Close Ticket",
    "summary": """
        Block messages when ticket is closed for portal users
    """,
    "author": "Solvos",
    "license": "AGPL-3",
    "version": "17.0.1.0.0",
    'category': "Helpdesk",
    "website": "https://github.com/solvosci/slv-helpdesk",
    "depends": ["helpdesk_mgmt"],
    "assets": {
        "web.assets_frontend": [
            "helpdesk_mgmt_portal_block_msg_close_ticket/static/src/js/portal.esm.js",
        ],
    },
    "data": [
        "views/res_config_settings_views.xml",
    ],
    'installable': True,
}
