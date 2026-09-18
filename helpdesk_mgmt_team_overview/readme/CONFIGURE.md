For a team and its members to appear in Team Performance and Gantt
Goals:

#. Go to **Helpdesk > Configuration > Helpdesk Teams**.
#. Open the team you want to include and set the technical field
   **Ticket Control** (``ticket_control``) to ``True``.
#. Make sure the team has users assigned in the **Members**
   (``user_ids``) field — only teams with members and
   ``ticket_control`` enabled are shown in the new views.

To mark a ticket as an **extra goal** instead of a main one:

#. Open the Helpdesk ticket.
#. Enable the **Extra Objective** (``extra_objetive``) field. By
   default, all tickets are considered main goals.

The date fields that delimit a ticket's period (``start_date`` /
``end_date``) must be filled in for the ticket to be counted within
the active week or month; tickets without these dates will not appear
in the goal counters.