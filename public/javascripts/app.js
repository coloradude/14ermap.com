
var $infoPane = $('#info-pane')
var $weather = $('#weather')
var geojson = {
  type : 'FeatureCollection',
  features : [] 
}



$.ajax({
  method: 'GET',
  url: '/geojson'
}).done(function(features){
  getSortTable()
  geojson.features = features;
  myLayer.setGeoJSON(geojson);
  setHoverForFeatureNames()
  myLayer.on('click', function(e){
    map.setView(e.latlng)
    $infoPane.toggleClass('slideInLeft');
    var geoId = e.layer.feature.id
    loadEditRoute(geoId)
    $.ajax({
      method: 'GET',
      url: '/' + e.layer.feature.properties.type + '/' + e.layer.feature._id, 
    }).done(function(data){
      $infoPane.html(data).addClass('slideInLeft');
      loadAJAX();
      loadEditFeatureDataPath()
      loadTooltips()
    })
  })
})

L.mapbox.accessToken ='pk.eyJ1IjoiY29sb3JhZHVkZSIsImEiOiJjaWY2NnN5MjAwYjVxc21rdTdzdWQwd2NtIn0.4_IhtN06SX3K3moZ1da-cg';

var map = L.mapbox.map('map', 'mapbox.streets')
  .setView([38.795, -106.611], 8);

var myLayer = L.mapbox.featureLayer().addTo(map);

function loadAJAX(){
  $('.feature-link').off('click').on('click', function(){
    if ($(this).attr('data-toggle')){
      //$(this).tooltip('hide')
    }
    $infoPane.toggleClass('slideInLeft')
    $.ajax({
      method: 'GET',
      url: $(this).val(),
    }).done(function(html){
      $('#info-pane').html(html).addClass('slideInLeft')
      loadAJAX();
      loadTooltips();
    })
  })
}

function loadEditRoute(geoId){
  $('.edit-feature').on('click', function(){
    console.log(geoId)
      $.ajax({
        url: '/update-feature/' + geoId,
        method: 'GET'
      }).done(function(html){
        $infoPane.html(html)
        loadRemoveFeature()
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
}

$(document).ready(function(){
  $('.close-it').on('click', function(){
    $infoPane.toggleClass('slideOutLeft')
    $.ajax({
      method: 'GET',
      url: '/sort'
    }).done(function(html){
      $infoPane.html(html).toggleClass('slideOutLeft').addClass('slideInLeft')
      loadFilters()
      loadSearch()
    })
  })
  $('.add-feature').on('click', function(){
    $.ajax({
      method: 'GET',
      url: '/add-feature'
    }).done(function(html){
      $infoPane.html(html)
    })
  })
})

function loadFilters(){
  $('#peak-range').on('change', function(e){
    var range = $(this).val()
    myLayer.setFilter(function(f){
      console.log(f)
      if (range === 'Mosquito' && f.properties.type === 'peak'){
        return f.data.range === 'Tenmile' || f.data.range === 'Mosquito'
      }
      if (f.data.range){
        return f.data.range.toLowerCase() === range.toLowerCase() && f.properties.type === 'peak'
      }
    });
    return false;
  })
}

function getSortTable(){
  $.ajax({
    method: 'GET',
    url: '/sort'
  }).done(function(html){
    $infoPane.html(html)
    loadFilters()
    loadSearch()
  })
}

function loadSearch(){
  $('.search-bar input').on('keyup', function(){
    var search = $(this).val().toLowerCase().replace(/[.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"")
    myLayer.setFilter(function(f){
      if (f.data.range && f.properties.type && f.data.name){
        return  f.data.range.replace(/[.,-\/#!$%\^&\*;:{}=\-_`~()]/g,'').toLowerCase().indexOf(search) > -1 ||
                f.data.name.replace(/[.,-\/#!$%\^&\*;:{}=\-_`~()]/g,'').toLowerCase().indexOf(search) > -1 
      }
    })
  })
}

function loadRemoveFeature(){
  $('.remove-feature').on('click', function(){
    if (window.confirm('Are you sure? This cannot be undone!')){
      $.ajax({
        method: 'POST',
        url: '/delete/' + $('.type').val() + '/' + $('.submit-update').attr('id')
      })
    }
  })
}

function setHoverForFeatureNames(){
  myLayer.on('mouseover', function(e) {
      e.layer.bindPopup(e.layer.feature.properties.name)
      e.layer.openPopup();
  });
  myLayer.on('mouseout', function(e) {
      e.layer.closePopup();
  });
}



function loadEditFeatureDataPath(){
  $('.update-peak-conditions').on('click', function(){
    $.ajax({
      method: 'GET',
      url: '/update-peak-conditions/' + $(this).attr('id')
    }).done(function(modal){
      $('body').append(modal)
      $('.modal').modal('show')
      $( "#datepicker" ).datepicker().on('keyup keydown', function(e){
        e.preventDefault()
      });
      $( "#datepicker" ).datepicker( "option", "dateFormat", 'yy-mm-dd');
      $('#datepicker').addClass('ll-skin-nigran')
      $('.modal').on('hide.bs.modal', function(){
        $(this).remove()
      })

    })
  })
}

function loadTooltips(){
  $('[data-toggle="tooltip"]').tooltip({container: 'body', placement: 'right'})
}














