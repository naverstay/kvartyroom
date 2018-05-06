var mainSlider, $body;
var myMap, myPlacemark, objectManager;

$(function ($) {
    $body = $('body');

    $body.delegate('.menuBtn', 'click', function () {
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

    initMainSlider();

});


function initMainSlider() {

    mainSlider = new Swiper('.mainSlider', {
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
            url: id % 2 ? 'list.json' : 'single.json',
            dataType: 'json',
            processData: false
        })).then(function (data) {
            // Имитируем задержку от сервера.
            return ymaps.vow.delay(data, 100);
        }).then(
            function (data) {
                console.log(data.balloonContent, data.balloonContent.length);
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
