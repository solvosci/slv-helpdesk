/** @odoo-module */

import {_t} from "@web/core/l10n/translation";
import publicWidget from "@web/legacy/js/public/public_widget";

publicWidget.registry.PortalHelpdeskUserSelect = publicWidget.Widget.extend({
    selector: "#portal_user_ids",

    start() {
        this.$el.select2({
            width: '100%',
            placeholder: _t("Select followers"),
        });

        return this._super(...arguments);
    },
});
