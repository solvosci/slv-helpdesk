# © 2020 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html
{
    "name": "Helpdesk Ticket Tree View order by recent",
    "summary": """
        Adds group that sorts tickets on tree view by last update date.
    """,
    "version": "12.0.2.0.0",
    "license": "LGPL-3",
    "category": "After-Sales",
    "author": "Solvos",
    "website": "https://github.com/solvosci/slv-helpdesk",
    "depends": [
        "helpdesk_mgmt_timesheet_readonly",
    ],
    "data": [
        "security/helpdesk_security.xml",
        "views/helpdesk_ticket_views.xml",
    ],
}
