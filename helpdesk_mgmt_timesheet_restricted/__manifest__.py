# © 2021 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html
{
    "name": "Helpdesk Group Timesheet Restricted",
    "summary": """
       Adds group that cannot see time data in the timesheet and tickets.
    """,
    "version": "15.0.1.0.0",
    "license": "LGPL-3",
    "category": "After-Sales",
    "author": "Solvos",
    "website": "https://github.com/solvosci/slv-helpdesk",
    "depends": [
        "helpdesk_mgmt_timesheet"
    ],
    "data": [
        "security/helpdesk_mgmt_timesheet_restricted.xml",
        "views/helpdesk_mgmt_timesheet_restricted.xml",
    ],
}
