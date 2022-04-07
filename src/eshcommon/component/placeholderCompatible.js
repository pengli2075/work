/**
 * 判断浏览器是否支持input的placeholder属性
 */
const placeholderCompatible = () => {
    // 判断浏览器是否支持placeholder属性
    var supportPlaceholder = 'placeholder' in document.createElement('input');
    // 当浏览器不支持placeholder属性时，重新添加placeholder到input上
    if (!supportPlaceholder) {
        $(':input[placeholder]').each(function (index, element) {
            var text = element.getAttribute('placeholder');
            var defaultValue = element.defaultValue;
            var value = element.value;
            if (!defaultValue && (value == text || !value)) {
                $(this).val(text);
                element.style.color = '#ccc';
            } else {
                element.style.color = '';
            }
            $(this).focus(function () {
                if ($(this).val() == text) {
                    $(this).val('');
                }
            });

            $(this).blur(function () {
                if ($(this).val() == '') {
                    $(this).val(text);
                }
            });
        });
    }
};
const PlaceholderCompatible = {
    placeholderCompatible: placeholderCompatible
}
export default PlaceholderCompatible;