# © 2021 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html
{
    "name": "Helpdesk Type Team Restricted",
    "summary": """
       Enables to restrict by user type selection on ticket depending on 
       assigned teams
    """,
    "version": "12.0.1.0.0",
    "license": "LGPL-3",
    "category": "After-Sales",
    "author": "Solvos",
    "website": "https://github.com/solvosci/slv-helpdesk",
    "depends": [
        "helpdesk_type",
    ],
    "data": [
        "security/helpdesk_type_team_restricted.xml",
        "views/helpdesk_ticket_view.xml",
    ],
}
