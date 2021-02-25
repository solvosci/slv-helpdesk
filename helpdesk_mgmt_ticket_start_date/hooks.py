# © 2020 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See https://www.gnu.org/licenses/lgpl-3.0.html
from odoo import api, SUPERUSER_ID


def post_init_hook(cr, registry):
    env = api.Environment(cr, SUPERUSER_ID, {})
    HelpdeskTicket = env['helpdesk.ticket']
    tickets = HelpdeskTicket.search([('start_date', '=', False)])

    for rec in tickets:
        rec.start_date = rec.create_date
