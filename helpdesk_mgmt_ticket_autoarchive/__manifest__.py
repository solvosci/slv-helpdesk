# © 2021 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html
{
    "name": "Helpdesk Ticket Autoarchive",
    "summary": """
        Adds an action to automatically archive tickets that have been closed
        for x time
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
        "data/ir_cron.xml",
        "views/res_company_views.xml",
    ],
}
