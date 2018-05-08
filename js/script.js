var mainSlider, $body;
var myMap, myPlacemark, objectManager, $metro_popup;
var autoCompleteOptions = {};

$(function ($) {
    $body = $('body');

    $body.delegate('.filterCollapseBtn', 'click', function () {
        $(this).closest('.search_form').toggleClass('filter_opened');
        return false;
    }).delegate('.menuBtn', 'click', function () {
        $body.toggleClass('menu_opened');
        return false;
    }).delegate('.filterBtn', 'click', function () {
        var $this = $(this), filters = {}, all_btns = $('.filterBtn');

        $this.toggleClass('_active');

        if ($this.hasClass('reset')) {
            all_btns.addClass('_active')
        }

        all_btns.each(function (ind) {
            var btn = $(this);
            filters[btn.attr('data-filter')] = btn.hasClass('_active');
        });

        objectManager.setFilter(getFilterFunction(filters));

        return false;
    });

    initAutoComplete($('.searchField'), autoCompleteOptions);

    initMainSlider();

    initSelect2();

    initMetroPopup();

    initToddlers();

    all_dialog_close();

});

function initSelect2() {

    $('.select2').each(function (ind) {
        var slct = $(this);

        slct.select2({
            minimumResultsForSearch: 10,
            dropdownParent: slct.parent(),
            width: 'auto',
            language: {
                noResults: function (e, r) {
                    return 'Нет результатов';
                    // return "Город не найден. <a href='#' class='gl_link _clr_turqoise'>Список городов</a>";
                }
            },
            escapeMarkup: function (markup) {
                return markup;
            },
            adaptDropdownCssClass: function () {
                return slct.attr('data-dropdown-class');
            }
        });
    });
}

function initMainSlider() {

    mainSlider = new Swiper('.mainSlider', {
        noSwipingSelector: '.slide_search_form',
        slidesPerView: 'auto',
        freeModeSticky: true,
        freeMode: true,
        loop: true,
        speed: 1000,
        //autoplay: {
        //    delay: 6000,
        //    disableOnInteraction: false
        //},
        pagination: {
            el: '.mainPagination',
            type: 'bullets',
            clickable: true
        },
        navigation: {
            nextEl: '.slideNext',
            prevEl: '.slidePrev'
        }
    });

}

/*function init() {
    map = new ymaps.Map("ymap", {
        controls: [],
        center: [55.606264, 37.617318],
        zoom: 14
    });

    myPlacemark = new ymaps.Placemark([55.608264, 37.617318], {
        hintContent: "ЖК 'Никольско-Трубецкое'",
    }, {
        balloonShadow: false,
        iconLayout: 'default#image',
        // Своё изображение иконки метки.
        iconImageHref: 'i/circle_blue.svg',
        // Размеры метки.
        iconImageSize: [17, 17],
        iconImageOffset: [-8, -8],
        balloonPanelMaxMapArea: 0,
        // Не скрываем иконку при открытом балуне.
        hideIconOnBalloonOpen: false,
        // И дополнительно смещаем балун, для открытия над иконкой.
        // balloonOffset: [3, -15]
    });

    map.geoObjects.add(myPlacemark);
}

ymaps.ready(init);*/

ymaps.ready(init);

function init() {
    myMap = new ymaps.Map('ymap', {
        center: [55.76, 37.64],
        zoom: 10,
        controls: []
    }, {
        searchControlProvider: 'yandex#search'
    });

    objectManager = new ymaps.ObjectManager({
        // Чтобы метки начали кластеризоваться, выставляем опцию.
        clusterize: true,
        // ObjectManager принимает те же опции, что и кластеризатор.
        gridSize: 64,
        // Макет метки кластера pieChart.
        clusterIconLayout: "default#pieChart"
    });

    myMap.geoObjects.add(objectManager);

    $.ajax({
        url: "data.json"
    }).done(function (data) {
        objectManager.add(data);
    });

    objectManager.objects.events.add('balloonopen', function (e) {
        // Получим объект, на котором открылся балун.
        var id = e.get('objectId'),
            geoObject = objectManager.objects.getById(id);
        // Загрузим данные для объекта при необходимости.
        downloadContent([geoObject], id);
    });
}

function downloadContent(geoObjects, id, isCluster) {
    // Создадим массив меток, для которых данные ещё не загружены.
    var array = geoObjects.filter(function (geoObject) {
            return geoObject.properties.balloonContent === 'идет загрузка...' ||
                geoObject.properties.balloonContent === 'Not found';
        }),
        // Формируем массив идентификаторов, который будет передан серверу.
        ids = array.map(function (geoObject) {
            return geoObject.id;
        });
    if (ids.length) {
        // Запрос к серверу.
        // Сервер обработает массив идентификаторов и на его основе
        // вернет JSON-объект, содержащий текст балуна для
        // заданных меток.
        ymaps.vow.resolve($.ajax({
            // Обратите внимание, что серверную часть необходимо реализовать самостоятельно.
            //contentType: 'application/json',
            //type: 'POST',
            //data: JSON.stringify(ids),
            url: list ? (id > 20 ? 'single.json' : 'list.json') : 'single.json',
            dataType: 'json',
            processData: false
        })).then(function (data) {
            // Имитируем задержку от сервера.
            return ymaps.vow.delay(data, 100);
        }).then(
            function (data) {
                geoObjects.forEach(function (geoObject) {
                    var balloon_html = '';
                    // Содержимое балуна берем из данных, полученных от сервера.
                    // Сервер возвращает массив объектов вида:
                    // [ {"balloonContent": "Содержимое балуна"}, ...]

                    if (data.balloonContent.length > 1) {
                        balloon_html = '<dl class="balloon_list">';

                        for (var i = 0; i < data.balloonContent.length; i++) {
                            balloon_html += balloon_item_builder(data.balloonContent[i]);
                        }

                        balloon_html += '</dl>';

                    } else {
                        var item = data.balloonContent[0];

                        balloon_html = '<div class="balloon_content">' +
                            '<div class="balloon_img"><img src="' + item.object_image_url + '" alt=""></div>' +
                            '<div class="balloon_name">' + item.object_name + '</div>' +
                            '<dl class="balloon_features">' +
                            '<dt>Класс:</dt>' +
                            '<dd>' + item.object_class + '</dd>' +
                            '<dt>Цена:</dt>' +
                            '<dd>' + item.object_price + '</dd>' +
                            balloon_transport_builder(item.object_transport) +
                            '</dl>' +
                            '</div>';
                    }

                    geoObject.properties.balloonContent = balloon_html;
                });
                // Оповещаем балун, что нужно применить новые данные.
                setNewData();
            }, function () {
                geoObjects.forEach(function (geoObject) {
                    geoObject.properties.balloonContent = 'Not found';
                });
                // Оповещаем балун, что нужно применить новые данные.
                setNewData();
            }
        );
    }

    function setNewData() {
        if (isCluster && objectManager.clusters.balloon.isOpen(id)) {
            objectManager.clusters.balloon.setData(objectManager.clusters.balloon.getData());
        } else if (objectManager.objects.balloon.isOpen(id)) {
            objectManager.objects.balloon.setData(objectManager.objects.balloon.getData());
        }
    }
}

function balloon_item_builder(item) {
    return '<dt>' + item.object_name + '</dt>' +
        '<dd>' + item.object_class + ', ' + item.object_price + '</dd>';
}

function balloon_transport_builder(transport) {
    var ret = '';

    for (var i = 0; i < transport.length; i++) {
        var tr = transport[i];

        ret += '<dt class="_wide">' + tr.transport_label + '</dt>' +
            '<dd class="_wide"><span>' + tr.transport_name + '</span>'
            + balloon_transport_icon(tr.transport_type)
            + '<span>' + tr.transport_time + '</span>' +
            '</dd>';
    }

    return ret;
}

function balloon_transport_icon(icon) {
    return '<span class="balloon_transport_icon _' + icon + '"></span>'
}

function getFilterFunction(categories) {
    return function (obj) {
        var content = obj.properties.tag;
        return categories[content]
    }
}

function initMetroPopup() {

    $metro_popup = $('#metro_popup').dialog({
        autoOpen: false,
        modal: true,
        closeOnEscape: true,
        closeText: '',
        dialogClass: 'dialog_g_size_1 dialog_close_butt_mod_1 region_popup',
        //appendTo: '.base',
        width: 1180,
        draggable: true,
        collision: "fit",
        position: {my: "top center", at: "top center", of: window},
        open: function (event, ui) {
            $body.addClass('modal_opened overlay_v2');
        },
        close: function (event, ui) {
            $body.removeClass('modal_opened overlay_v2');
        }
    });

    $('.openMetroPopup').on('click', function () {
        $metro_popup.dialog('open');
        return false;
    });
}

function all_dialog_close() {
    $body.on('click', '.ui-widget-overlay, .popupClose', all_dialog_close_gl);
}

function all_dialog_close_gl() {
    $(".ui-dialog-content").each(function () {
        var $this = $(this);
        if (!$this.parent().hasClass('always_open')) {
            $this.dialog("close");
        }
    });
}

function toNum(str) {
    return parseInt(str.toString().replace(/\D*/g, ''));
}

function numFormat(str) {
    return str.replace(/(?!^)(?=(\d{3})+(?=\.|$))/gm, ' ');
}

function resize(inp) {
    var el = $(inp), txt = el.nextAll('.widthPattern').text(el.val());
    el.attr('style', 'width:' + (txt.outerWidth() + 1) + 'px !important;');
}

function initDynamicWidth($el) {
    $el.each(function () {
        var inp = $(this), ptrn = $('<span class="widthPattern" />');

        ptrn.css({
            'position': 'absolute',
            'top': -99999,
            'left': -99999,
            // 'top': 0,
            // 'left': -300,
            'pointer-events': 'none',
            'white-space': 'nowrap',
            'padding': inp.css('padding'),
            'border': inp.css('border'),
            'font-size': inp.css('font-size'),
            'font-style': inp.css('font-style'),
            'font-family': inp.css('font-family'),
            'font-weight': inp.css('font-weight'),
            'letter-spacing': inp.css('letter-spacing')
        });

        inp.after(ptrn);

        var e = 'keyup,keypress,focus,blur,change,update'.split(',');
        for (var i in e) inp.on(e[i], function () {
            resize(this);
        });
        resize(this);
    });
}

function initAutoComplete(el, options) {
    if (el.length) {
        el.easyAutocomplete(options);
    }
}

function moneyFormat(str) {
    return str.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
}

function getPural(n, str1, str2, str5) {
    return ' ' + ((((n % 10) == 1) && ((n % 100) != 11)) ? (str1) : (((((n % 10) >= 2) && ((n % 10) <= 4)) && (((n % 100) < 10) || ((n % 100) >= 20))) ? (str2) : (str5)))
}

function tipFormat(val, format) {
    if (format === 'fixed') {
        return (val / 1000000).toFixed(1);
    } else if (format === 'place') {
        return parseInt(val);
    } else if (format === 'money') {
        return moneyFormat(val.toString());
    } else {
        return val;
    }
}

function initToddlers() {
    var canUpdate = true;

    $('.filterToddler').each(function (ind) {
        var tdlr = $(this),
            filter = tdlr.closest('.filterBlock'),
            single = tdlr.attr('data-single'),
            min = parseInt(tdlr.attr('data-min')) || 0,
            max = parseInt(tdlr.attr('data-max')) || 10;

        initDynamicWidth(filter.find('input.val'));

        if (single) {
            noUiSlider.create(this, {
                start: max * .2,
                connect: [true, false],
                range: {
                    'min': min,
                    'max': max
                }
            });
        } else {
            noUiSlider.create(this, {
                start: [max * .2, max * .8],
                connect: true,
                range: {
                    'min': min,
                    'max': max
                }
            });
        }

        this.noUiSlider.on('update', function (values, handle) {
            var target = $(this.target),
                filter = target.closest('.filterBlock'),
                plural = target.attr('data-plural'),
                show_value = target.attr('data-show-value'),
                plural_text = target.attr('data-plural-text') || '',
                format = target.attr('data-format') || '',
                suffix_1 = target.attr('data-suffix_1') || '',
                suffix_2 = target.attr('data-suffix_2') || '',
                val_1 = parseInt(values[0]),
                val_2 = parseInt(values[1]),
                plural_suffix_1 = target.attr('data-plural-suffix_1') || false,
                plural_suffix_2 = target.attr('data-plural-suffix_2') || false,
                plural_1 = '',
                plural_2 = '',
                arr = [];

            if (show_value) {
                var tdlr = $(this.target);

                tdlr.find('.noUi-handle').each(function (ind) {
                    var val = values[ind];
                    $(this).html('<span class="toddler_tip">' +
                        tipFormat(val, format) +
                        suffix_1 + '</span>');
                });
            }

            if (plural != void 0) {
                arr = plural.split(',');
                plural_1 = plural.length > 0 ? getPural(val_1, arr[0], arr[1], arr[2]) : '';
                plural_2 = plural.length > 0 ? getPural(val_2, arr[0], arr[1], arr[2]) : '';

            } else if (plural_text.length) {
                plural_1 = plural_2 = plural_text;
            }

            if (canUpdate) {
                resize(filter.find('.start .val').val(
                    (format ? ('money' == format ? moneyFormat(val_1.toString()) : val_1) : val_1) +
                    suffix_1 + (plural_suffix_1 ? getPural(val_1, arr[0], arr[1], arr[2]) : '')
                ));

                resize(filter.find('.end .val').val(
                    (format ? ('money' == format ? moneyFormat(val_2.toString()) : val_2) : val_2) +
                    suffix_2 + (plural_suffix_2 ? getPural(val_2, arr[0], arr[1], arr[2]) : '')
                ));

                filter.find('.start .val').each(function (ind) {
                    var inp = $(this), plrl = inp.nextAll('.plural');

                    if (plrl.length && plrl.attr('data-plural')) {
                        var arr = plrl.attr('data-plural').split(',');
                        plrl.text(getPural(val_1, arr[0], arr[1], arr[2]));
                    }
                });

                filter.find('.end .val').each(function (ind) {
                    var inp = $(this), plrl = inp.nextAll('.plural');

                    if (plrl.length && plrl.attr('data-plural')) {
                        var arr = plrl.attr('data-plural').split(',');
                        plrl.text(getPural(val_2, arr[0], arr[1], arr[2]));
                    }
                });
            }

            filter.find('.min').html(
                (format ? ('money' == format ? moneyFormat(val_1.toString()) : val_1) : val_1) + ' ' +
                plural_1
            );

            filter.find('.max').html(
                (format ? ('money' == format ? moneyFormat(val_2.toString()) : val_2) : val_2) + ' ' +
                plural_2
            );

        });

        filter.find('.start input.val').on('keyup keypress change update', function () {
            canUpdate = false;
            tdlr[0].noUiSlider.set([toNum($(this).val()), null]);
        }).on('blur', function () {
            canUpdate = true;
            tdlr[0].noUiSlider.set([toNum($(this).val()), null]);
        });

        filter.find('.end input.val').on('keyup keypress change update', function () {
            canUpdate = false;
            tdlr[0].noUiSlider.set([null, toNum($(this).val())]);
        }).on('blur', function () {
            canUpdate = true;
            tdlr[0].noUiSlider.set([null, toNum($(this).val())]);
        });

        filter.find('.toddlerSelect').each(function (ind) {
            var slct = $(this), target = filter.find(slct.attr('data-target'));

            slct.on('change', function (e) {
                var _this = $(this);
                canUpdate = true;

                if (_this.attr('data-target') == '.start') {
                    tdlr[0].noUiSlider.set([_this.val(), null]);
                } else if ($(this).attr('data-target') == '.end') {
                    tdlr[0].noUiSlider.set([null, _this.val()]);
                }

            }).select2({
                minimumResultsForSearch: Infinity,
                dropdownParent: target,
                width: '100%',
                language: {
                    noResults: function (e, r) {
                        return 'Нет результатов';
                        // return "Город не найден. <a href='#' class='gl_link _clr_turqoise'>Список городов</a>";
                    }
                },
                templateResult: function (data) {
                    return $.isNumeric(data.text) ? numFormat(data.text) : data.text;
                },
                escapeMarkup: function (markup) {
                    return markup;
                },
                adaptDropdownCssClass: function () {
                    return slct.attr('data-dropdown-class');
                }
            });

            target.on('click', function () {
                slct.select2('open');
                return false;
            });
        });

    });
}

