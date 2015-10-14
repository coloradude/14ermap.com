
var $infoPane = $('#info-pane')
var $weather = $('#weather')

var geojsonA;
$.ajax({
  method: 'GET',
  url: '/geojson'
}).done(function(res){
  console.log(res.geojson)

  geojsonA = res.geojson;
  myLayer.setGeoJSON(geojsonA);

  myLayer.on('mouseover', function(e) {
      e.layer.bindPopup(e.layer.feature.properties.name)
      e.layer.openPopup();
  });
  myLayer.on('mouseout', function(e) {
      e.layer.closePopup();
  });

  myLayer.on('click', function(e){
    map.setView(e.latlng)
    $infoPane.toggleClass('slideInLeft');
    var geoId = e.layer.feature.id
    $('.edit-feature').on('click', function(){
      $.ajax({
        url: '/update-feature/' + geoId,
        method: 'GET'
      }).done(function(html){
        $infoPane.html(html)
        $('.submit-update-submit').on('click', function(e){
          e.preventDefault()
          $.ajax({
            url: '/update-feature/' + $('.submit-update').attr('id'),
            method: 'POST',
            data: {
              id: $('.submit-update').attr('id'),
              name: $('#name').val(),
              type: $('#type').val(),
              _id: $('#_id').val(),
              thumbnail: $('#thumbnail').val(),
              isStandard: $('#isStandard').prop('checked'),
              isSnowOnly: $('#isSnowOnly').prop('checked'),
              images: $('#more-images').val()
            }
          }).done(function(res){
            console.log(res)
          })
        })
      })
    })
    $.ajax({
      method: 'GET',
      url: '/' + e.layer.feature.properties.type + '/' + e.layer.feature.properties._id,
    }).done(function(data){
      $infoPane.html(data).addClass('slideInLeft');
      loadAJAX();
    })
  })
})

L.mapbox.accessToken ='pk.eyJ1IjoiY29sb3JhZHVkZSIsImEiOiJjaWY2NnN5MjAwYjVxc21rdTdzdWQwd2NtIn0.4_IhtN06SX3K3moZ1da-cg';

var map = L.mapbox.map('map', 'mapbox.streets')
  .setView([38.638, -107.391], 7);

var myLayer = L.mapbox.featureLayer().addTo(map);



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


















