/** @odoo-module */

import { patch } from "@web/core/utils/patch";
import PortalChatter from "@portal/js/portal_chatter";

patch(PortalChatter.prototype, {

    async start() {
        if (this.options?.res_model === "helpdesk.ticket") {

            const hide = await this.rpc('/web/dataset/call_kw/helpdesk.ticket', {
                model: "helpdesk.ticket",
                method: "portal_should_hide_composer",
                args: [[this.options.res_id]],
                kwargs: {},
            });

            if (hide) {
                this.options.display_composer = false;
            }
        }

        return super.start(...arguments);
    },

});
