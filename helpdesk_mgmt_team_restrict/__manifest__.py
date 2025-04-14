# © 2025 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html
{
    "name": "Helpdesk Team Restrict",
    "summary": """
        Hide the teams I do not belong to on "User: Personal tickets" and "User: Team tickets" groups.
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
        "security/helpdesk_type_team_restricted.xml",
    ],
}
