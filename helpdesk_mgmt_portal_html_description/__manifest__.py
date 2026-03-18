# © 2026 Solvos Consultoría Informática (<http://www.solvos.es>)
# License AGPL-3 - See http://www.gnu.org/licenses/agpl-3.0.html
{
    "name": "Helpdesk Ticket Portal Html Description",
    "summary": """
        The ‘description’ field when creating ticket form for portal users is now an HTML field
    """,
    "author": "Solvos",
    "license": "AGPL-3",
    "version": "17.0.1.0.0",
    'category': "Helpdesk",
    "website": "https://github.com/solvosci/slv-helpdesk",
    "depends": ["helpdesk_mgmt"],
    "data": [
        "views/helpdesk_ticket_templates.xml"
    ],
    'assets': {
        'web.assets_frontend': [
            'helpdesk_mgmt_portal_html_description/static/src/o_wysiwyg_loader.js',
        ],
    },
    "installable": True,
}
