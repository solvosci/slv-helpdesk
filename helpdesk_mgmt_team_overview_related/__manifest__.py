# © 2026 Solvos Consultoría Informática (<http://www.solvos.es>)
# License AGPL-3 - See http://www.gnu.org/licenses/agpl-3.0.html
{
    "name": "Helpdesk Team Overview - Related Users",
    "summary": """
        Bridge addon between helpdesk_mgmt_team_overview and helpdesk_mgmt_ticket_related_users.

        Adds the tickets where a user is a related user to the Team Performance dashboard:
        - Related ticket counter next to the Main and Extra objectives, without affecting the progress rings.
        - Avatars (up to 5) of the owners of those tickets.
        - Panel split into "Own Tickets" and "Related Tickets" sections.
    """,
    "version": "17.0.1.0.0",
    "category": "Helpdesk",
    "website": "https://github.com/solvosci/slv-helpdesk",
    "author": "Solvos",
    "license": "AGPL-3",
    "depends": [
            "helpdesk_mgmt_team_overview",
            "helpdesk_mgmt_ticket_related_users",
    ],
    "assets": {
        "web.assets_backend": [
            "helpdesk_mgmt_team_overview_related/static/src/components/**/**/*.js",
            "helpdesk_mgmt_team_overview_related/static/src/components/**/**/*.xml",
            "helpdesk_mgmt_team_overview_related/static/src/components/**/**/*.scss",
        ],
    },
    "installable": True,
    "application": False,
}
