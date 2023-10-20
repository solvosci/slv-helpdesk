# © 2020 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html
{
    "name": "Helpdesk Ticket Tree View Decoration",
    "summary": """
        Adds decoration on tickets tree view. 
        Put decoration according to ticket stage: 
        red for unattended tickets, green for closed tickets.
    """,
    "version": "15.0.1.0.0",
    "license": "LGPL-3",
    "category": "After-Sales",
    "author": "Solvos",
    "website": "https://github.com/solvosci/slv-helpdesk",
    "depends": [
        "helpdesk_mgmt",
    ],
    "data": [
        "views/helpdesk_ticket_views.xml",
    ],
}
