ymaps.ready(init);

function init() {
    const map = new ymaps.Map("map", {
        center: [51.764080, 55.101034],
        zoom: 15
    });

    const placemark = new ymaps.Placemark([51.764080, 55.101034], {
        hintContent: 'Кофейня "Небо и Земля"',
        balloonContent: 'Адрес: ул. Советская, 37'
    },
        {
            iconLayout: 'default#image',
            iconImageHref: '/assets/images/location.svg',
            iconImageSize: [50, 50],
            iconImageOffset: [-20, -40]
        });

    map.geoObjects.add(placemark);
}