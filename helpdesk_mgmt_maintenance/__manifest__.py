# © 2023 Solvos Consultoría Informática (<http://www.solvos.es>)
# License LGPL-3 - See http://www.gnu.org/licenses/lgpl-3.0.html
{
    "name": "HelpDesk Tickets Maintenance",
    "summary": "Links helpdesk tickets with maintenance equipments.",
    "version": "16.0.1.0.0",
    "category": "After-Sales",
    "website": "https://github.com/solvosci/slv-helpdesk",
    "author": "Solvos",
    "license": "LGPL-3",
    "application": False,
    "installable": True,
    "depends": [
        "base_maintenance_group",
        "helpdesk_mgmt"
    ],
    "data": [
        "views/maintenance_equipment_views.xml",
        "views/helpdesk_ticket_views.xml", 
        "security/helpdesk_mgmt_maintenance_security.xml",  
    ],
}
