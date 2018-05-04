var mainSlider;

$(function ($) {
    console.log(100500);

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
