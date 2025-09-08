odoo.define('helpdesk_ticket_attachment_enhacer_from_mobile.portal_attachments_mobile', [], function (require) {
    'use strict';

    const maxFiles = 5;

    const originalInput = document.querySelector('input[name="attachment"]');
    if (!originalInput) return;

    const container = originalInput.parentElement.parentElement;
    const originalWrapper = originalInput.parentElement;

    // Detects whether the user is browsing from a mobile device
    function mobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // Stop execution if the user is not on a mobile device
    if (!mobileDevice()) {
        return;
    }

    container.addEventListener('change', (e) => {
        const fileInputs = container.querySelectorAll('input[type="file"]');

        if (e.target.files.length > 0 && fileInputs.length < maxFiles) {
            const newInputWrapper = originalWrapper.cloneNode(true);
            const newInput = newInputWrapper.querySelector('input[type="file"]');

            newInput.value = '';
            newInput.id = 'attachment' + fileInputs.length;
            newInput.name = 'attachment';

            newInputWrapper.style.marginTop = '10px';

            container.appendChild(newInputWrapper);
        }
    });
});
