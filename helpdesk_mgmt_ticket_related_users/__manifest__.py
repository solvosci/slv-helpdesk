# © 2025 Solvos Consultoría Informática (<http://www.solvos.es>)
# License AGPL-3 - See http://www.gnu.org/licenses/agpl-3.0.html
{
    "name": "Helpdesk Ticket Related Users",
    "summary": """
        Allows assigning related users to helpdesk tickets in addition to the usual participants.
    """,
    "author": "Solvos",
    "license": "AGPL-3",
    "version": "17.0.1.0.0",
    'category': "Helpdesk",
    "website": "https://github.com/solvosci/slv-helpdesk",
    "depends": ["helpdesk_mgmt"],
    "data": [
        "views/helpdesk_mgmt_ticket_related_users_menus.xml",
        "views/helpdesk_ticket_views.xml"
    ],
    "installable": True,
}
