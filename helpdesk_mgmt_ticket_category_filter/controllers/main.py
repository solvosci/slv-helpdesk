import json
from odoo import http
from odoo.http import request

class HelpdeskDynamicCategory(http.Controller):

    @http.route(['/helpdesk_mgmt/get_subcategories'], type='json', auth='public', website=True)
    def get_subcategories(self):

        try:
            body = request.httprequest.get_data(as_text=True)
            data = json.loads(body)
            parent_id = data.get('parent_id')
        except Exception:
            parent_id = None

        if not parent_id:
            return []
        categories = request.env['helpdesk.ticket.category'].sudo().search([
            ('parent_id', '=', int(parent_id))
        ])

        return [
            {'id': c.id, 'name': c.name}
            for c in categories
        ]
