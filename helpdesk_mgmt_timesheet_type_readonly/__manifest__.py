# © 2021 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html
{
    "name": "Helpdesk Ticket Timesheet Type Readonly Group",
    "summary": """
       Adds Helpdesk Type readonly permissions 
       to Tickets & Timesheet Readonly group
    """,
    "version": "12.0.1.0.0",
    "license": "LGPL-3",
    "category": "After-Sales",
    "author": "Solvos",
    "website": "https://github.com/solvosci/slv-helpdesk",
    "depends": [
        "helpdesk_mgmt_timesheet_readonly",
        "helpdesk_type",
    ],
    "data": [
        "security/ir.model.access.csv",
    ],
}
