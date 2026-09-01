from odoo import fields


def post_init_hook(env):
	"""Calculate `start_date` and `end_date` for existing helpdesk tickets.

	- start_date: day of creation (`create_date`).
	- end_date: today unless ticket is closed, then use `last_stage_update`.

	By default, set ‘ticket control’ to ‘true’
	"""
	tickets = env["helpdesk.ticket"].sudo().search([])
	today = fields.Date.today()
	teams = env["helpdesk.ticket.team"].sudo().search([])
	teams.write({"ticket_control": True})
	for ticket in tickets:
		ticket.start_date = fields.Date.to_date(ticket.create_date)
		if not ticket.closed:
			ticket.end_date = today
		else:
			ticket.end_date = fields.Date.to_date(ticket.last_stage_update)
