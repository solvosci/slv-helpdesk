# © 2024 Solvos Consultoría Informática (<http://www.solvos.es>)
# License AGPL-3 - See http://www.gnu.org/licenses/lgpl-3.0.html
{
    "name": "Helpdesk Mgmt Ticket Invoice",
    "summary": """
        Adds relation between tickets and invoices
    """,
    "author": "Solvos",
    "license": "AGPL-3",
    "version": "13.0.1.0.0",
    "category": "Uncategorized",
    "website": "https://github.com/solvosci/slv-helpdesk",
    "depends": [
        "helpdesk_mgmt",
        "account",
    ],
    "data": [
        "views/account_move_view.xml",
        "views/helpdesk_ticket_view.xml",
    ],
    'installable': True,
}
