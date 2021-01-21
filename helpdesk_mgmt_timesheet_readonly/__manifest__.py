# © 2021 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html
{
    "name": "Helpdesk Ticket Timesheet Readonly Group",
    "summary": """
       Adds a custom group with readonly permissions for
       combined tickets & timesheets within an independent category
    """,
    "version": "12.0.1.0.1",
    "license": "LGPL-3",
    "category": "After-Sales",
    "author": "Solvos",
    "website": "https://github.com/solvosci/slv-helpdesk",
    "depends": [
        "helpdesk_mgmt_timesheet",
    ],
    "data": [
        "data/helpdesk_mgmt_timesheet_readonly_data.xml",
        "security/helpdesk_mgmt_timesheet_readonly.xml",
        "security/ir.model.access.csv",
        "views/helpdesk_ticket_view.xml",
    ],
}
