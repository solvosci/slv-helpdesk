# © 2025 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See http://www.gnu.org/licenses/lgpl-3.0.html
{
    "name": "Helpdesk Ticket Category Filter",
    "summary": """
        Select parent/child categories dynamically in Helpdesk tickets on portal
    """,
    "author": "Solvos",
    "license": "AGPL-3",
    "version": "17.0.1.0.0",
    'category': "Helpdesk",
    "website": "https://github.com/solvosci/slv-helpdesk",
    "depends": ["helpdesk_mgmt"],
    "assets": {
        "web.assets_frontend": [
            "helpdesk_mgmt_ticket_category_filter/static/src/js/dynamic_category.js",
        ],
    },
    "data": [
        "views/helpdesk_ticket_template.xml",
    ],
    'installable': True,
}
