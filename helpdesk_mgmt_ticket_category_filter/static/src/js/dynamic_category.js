$(document).ready(function() {
    const $parent_category = $('#parent-category');
    const $subcategory = $('#category_id');
    const $original_category = $('#category');

    if (!$parent_category.length || !$subcategory.length || !$original_category.length) return;

    $parent_category.on('change', function() {
        const parent_id = $(this).val();

        $subcategory.empty().append($('<option>', { value: '', text: '-' }));
        $subcategory.prop('disabled', true).prop('required', false);
        $original_category.val('');

        if (!parent_id) return;

        $.ajax({
            url: '/helpdesk_mgmt/get_subcategories',
            type: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({ parent_id: parent_id }),

            success: function(response) {
                const result = response.result;

                if (Array.isArray(result) && result.length > 0) {
                    result.forEach(function(cateogry) {
                        $subcategory.append($('<option>', { value: cateogry.id, text: cateogry.name }));
                    });

                    $subcategory.prop('disabled', false).prop('required', true);
                } else {
                    $original_category.val(parent_id);
                }
            },

            error: function(err) {
                console.error('Error loading subcategories:', err);
            }
        });
    });

    $subcategory.on('change', function() {
        const subcat_id = $(this).val();
        $original_category.val(subcat_id);
    });

});
