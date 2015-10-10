
var $infoPane = $('#info-pane')
var $weather = $('#weather')

L.mapbox.accessToken ='pk.eyJ1IjoiY29sb3JhZHVkZSIsImEiOiJjaWY2NnN5MjAwYjVxc21rdTdzdWQwd2NtIn0.4_IhtN06SX3K3moZ1da-cg';

var map = L.mapbox.map('map', 'mapbox.streets')
  .setView([38.638, -107.391], 7);

var myLayer = L.mapbox.featureLayer().addTo(map);
myLayer.setGeoJSON(geojson);
myLayer.on('mouseover', function(e) {
    e.layer.openPopup();
});
myLayer.on('mouseout', function(e) {
    e.layer.closePopup();
});

myLayer.on('click', function(e){
  map.setView(e.latlng)
  console.log(e.layer.feature.properties._id)
  $infoPane.toggleClass('slideInLeft');
  $.ajax({
    method: 'GET',
    url: '/' + e.layer.feature.properties.type + '/' + e.layer.feature.properties._id,
  }).done(function(data){
    $infoPane.html(data).addClass('slideInLeft');
    loadAJAX();
  })
  
})

function loadAJAX(){
  $('.feature-link').off('click').on('click', function(){
    $infoPane.toggleClass('slideInLeft')
    $.ajax({
      method: 'GET',
      url: $(this).val(),
    }).done(function(html){
      $('#info-pane').html(html).addClass('slideInLeft')
      loadAJAX();
    })
  })
}


















