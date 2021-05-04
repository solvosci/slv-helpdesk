from odoo import api, fields, models


class AccountAnalyticLine(models.Model):
    _inherit = 'account.analytic.line'

    def create_timesheet(self):
        self.ensure_one()
        active_id = self._context.get('active_id', False)

        if active_id and self._context.get('active_model') == 'helpdesk.ticket':
            self.env['account.analytic.line'].create({
                'date': self.date,
                'project_id': self.project_id,
                'task_id': self.task_id,
                'ticket_id': self.ticket_id,
                'name': self.name,
                'amount': self.amount,
                'unit_amount': self.unit_amount
            })
        return {'type': 'ir.actions.act_window_close'}
