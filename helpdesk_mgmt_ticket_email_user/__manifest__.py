# © 2026 Solvos Consultoría Informática (<http://www.solvos.es>)
# License AGPL-3 - See http://www.gnu.org/licenses/agpl-3.0.html
{
    "name": "Helpdesk Ticket Email User",
    "summary": """
        Adds new field 'end recipients' on the Compose Email wizard.
        This field is a list of the ticket's current followers.
        If some or all of them are removed, that change will be reflected in the
        mailing and will affect the final mailing list.
    """,
    "author": "Solvos",
    "license": "AGPL-3",
    "version": "17.0.1.0.0",
    'category': "Helpdesk",
    "website": "https://github.com/solvosci/slv-helpdesk",
    "depends": ["helpdesk_mgmt"],
    "data": [
        "wizard/mail_compose_message_views.xml",
    ],
    "installable": True,
}
