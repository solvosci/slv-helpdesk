# © 2026 Solvos Consultoría Informática (<https://www.solvos.es>)
# License AGPL-3 - See http://www.gnu.org/licenses/agpl-3.0.html

{
    "name": "Helpdesk Type - special types for security issues",
    "summary": """
        Adds an extra option for types that enables adding danger level and impact new mandatory fields for tickets
    """,
    "author": "Solvos",
    "license": "LGPL-3",
    "version": "12.0.1.0.0",
    "category": "After-Sales",
    "website": "https://github.com/solvosci/slv-helpdesk",
    "depends": ["helpdesk_type"],
    "data": [
        "views/helpdesk_ticket_type_views.xml",
        "views/helpdesk_ticket_views.xml",
    ],
    "installable": True,
}
