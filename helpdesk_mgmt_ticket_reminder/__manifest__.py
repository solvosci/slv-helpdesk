# © 2020 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html
{
    "name": "Helpdesk Ticket Reminder",
    "summary": """
        Adds a custom email reminder of ticket inactivity in Helpdesk.
    """,
    "version": "12.0.1.0.0",
    "license": "LGPL-3",
    "category": "After-Sales",
    "author": "Solvos",
    "website": "https://github.com/solvosci/slv-helpdesk",
    "depends": [
        "helpdesk_mgmt",
    ],
    "data": [
        "data/mail_template_data.xml",
        "data/ir_cron_data.xml",
    ],
}
