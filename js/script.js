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

            filters[btn.text()] = btn.hasClass('_active');
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

}

function getFilterFunction(categories) {
    return function (obj) {
        var content = obj.properties.balloonContent;
        return categories[content]
    }
}
