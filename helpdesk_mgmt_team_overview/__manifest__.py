{
    "name": "Helpdesk Team Overview",
    "summary": """
        Adds two views Team Performance and Gantt Goals to helpdesk teams,
        allowing to see the performance of the team and control the tickets.
    """,
    "version": "17.0.1.0.0",
    "category": "Helpdesk",
    "website": "https://github.com/OCA/helpdesk",
    "author": "Solvos, Odoo Community Association (OCA)",
    "license": "AGPL-3",
    "depends": ["helpdesk_mgmt"],
    "data": [
        "views/helpdesk_owl_calendar_menu.xml",
        "views/helpdesk_owl_panel_menu.xml",
        "views/helpdesk_ticket_views.xml",
        "views/helpdesk_ticket_team_views.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "helpdesk_mgmt_team_overview/static/src/components/**/**/*.js",
            "helpdesk_mgmt_team_overview/static/src/components/**/**/*.xml",
            "helpdesk_mgmt_team_overview/static/src/components/**/**/*.scss",
        ]
    },
    "post_init_hook": "post_init_hook",
    "installable": True,
    "application": False,
}
