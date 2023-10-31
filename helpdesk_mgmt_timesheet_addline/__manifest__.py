# © 2021 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html
{
    "name": "Helpdesk Ticket Timesheet Add Line",
    "summary": """
        Adds a more accesible button for timesheet creation within ticket form
    """,
    "version": "15.0.1.0.0",
    "license": "LGPL-3",
    "category": "After-Sales",
    "author": "Solvos",
    "website": "https://github.com/solvosci/slv-helpdesk",
    "depends": [
        "helpdesk_mgmt_timesheet",
    ],
    "data": [
        "views/helpdesk_ticket_addline_view.xml",
        "views/helpdesk_ticket_timesheet_views.xml",
    ],
}
