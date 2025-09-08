# © 2025 Solvos Consultoría Informática (<http://www.solvos.es>)
# License AGPL-3 - See http://www.gnu.org/licenses/agpl-3.0.html
{
    "name": "Helpdesk Portal Ticket Multi Attach Mobile",
    "summary": """
        Enable multiple fields for ticket creation via mobile to allow uploading multiple photos taken from the device camera
    """,
    "author": "Solvos",
    "license": "AGPL-3",
    "version": "17.0.1.0.0",
    'category': "Helpdesk",
    "website": "https://github.com/solvosci/slv-helpdesk",
    "depends": ["helpdesk_mgmt"],
    "assets": {
        "web.assets_frontend": [
            "helpdesk_mgmt_portal_ticket_multiattach_mobile/static/src/js/custom_script.js",
        ],
    },
    "data": [
        "views/helpdesk_ticket_template.xml",
    ],
    'installable': True,
}
