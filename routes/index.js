var express = require('express');
var router = express.Router();
var db = require('monk')(process.env.MONGOLAB_URI || "mongodb://localhost/fourteeners");
var peaks = db.get('peaks');
var routes = db.get('routes')
var trailheads = db.get('trailheads')
var geoJSON = db.get('geoJSON')
var geoIndividual = db.get('geojson-individual')
var fs = require('fs')
var request = require('request')


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/peak/:id', function(req, res, next) {
  peaks.findOne({_id: req.params.id}, function(err, peak){
    if (err) throw err;
    request('http://api.openweathermap.org/data/2.5/forecast?lat=' + peak.latitutde + '&lon=' + peak.longitude + '&cnt=5&APPID=9168266ea473f720024dc6501a3dec27', function (error, response, weather) {
      if (err) throw err;
      if (!error && response.statusCode == 200) {
        var weather = JSON.parse(weather)
        routes.find({peakKeys: peak.pkKey}, function(err, routes){
          if (err) throw err;
          trailheads.find({pkKeys: peak.pkKey}, function(err, trailheads){
            if (err) throw err;
            res.render('peak', {peak: peak, routes: routes, trailheads: trailheads, weather: weather.list}, function(err, html){
              if (err) throw err;
              res.send(html)
            })
          })
        })
      }
    })
  });
});

router.get('/trailhead/:id', function(req, res, next) {
  trailheads.findOne({_id: req.params.id}, function(err, trailhead){
    if (err) throw err;
    routes.find({trailheadKey: trailhead.thKey}, function(err, routes){
      if (err) throw err;
      peaks.find({pkKey: {$all: trailhead.pkKeys}}, function(err, peaks){
        if (err) throw err;
        res.render('trailhead', {trailhead: trailhead, routes: routes, peaks: peaks}, function(err, html){
          if (err) throw err;
          res.send(html);
        })
      })
    })
  });
});

router.get('/route/:id', function(req, res, next) {
  routes.findOne({_id: req.params.id}, function(err, route){
    if (err) throw err; 
    trailheads.find({thKey: route.trailheadKey}, function(err, trailhead){
      if (err) throw err;
      var trailhead = trailhead[0]
      peaks.find({pkKey: { $all: route.peakKeys }}, function(err, peaks){
        if (err) throw err;
        res.render('route', { route: route, trailhead: trailhead, peaks: peaks }, function(err, html){
          if (err) throw err;
          res.send(html);
        })
      })
    })
  });
});


router.get('/geoJSON', function(req, res){
  geoJSON.findOne({}, function(err, geoJSON){
    res.send(geoJSON);
  })
})

router.get('/update-feature/:id', function(req, res){
  res.render('update-form', {id: req.params.id}, function(err, html){
    if (err) throw err;
    res.send(html)
  })
})
router.post('/update-feature/:id', function(req, res){
  console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
  // geoIndividual.findOne({id: req.body.id}, function(err, result){
  //   console.log(result)
  // })
  // geoJSON.findOne({_id: req.body._id}, function(err, result){
  //   console.log(result)
  // })
  console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')

  geoIndividual.findOne({id: req.body.id}, function(err, doc){
    var replacement = doc
    replacement._id = req.body._id
    replacement.properties.name = req.body.name
    replacement.properties.type = req.body.type 
    delete replacement.properties.desc
    delete replacement.properties.ele
    delete replacement.properties.title
    delete replacement.properties.sym
    geoIndividual.remove({id: req.body.id})
    geoIndividual.insert(replacement)

    if (req.body.type === 'peak'){
      peaks.findOne({ _id: req.body._id}, function(err, result){
        console.log(result)
        result.thumbnail = req.body.thumbnail
        if (req.body.type === 'route'){
          result.isStandard = req.body.isStandard
          result.isSnowOnly = req.body.isSnowOnly
        } 
        if (req.body.images){
          result.images = req.body.images.split(' ')
        }
        peaks.remove({_id: req.body._id})
        peaks.insert(result)
      })
    }
    
  })
 
  

  // if (req.body.type === 'route'){
  //   geoJSON.findAndModify({ _id: req.body._id }, { 
  //     $set: {
  //       isStandard: req.body.isStandard,
  //       isSnowOnly: req.body.isSnowOnly
  //     }
  //   }, function(err){ if (err) throw err })
      
  // } 

  // geoJSON.findAndModify({query: {_id: req.body._id}, update: {$push : {images: req.body.images.split(',')}}}, function(err){ if (err) throw err })

  console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')


  // geoIndividual.findOne({id: req.body.id}, function(err, result){
  //   console.log(result)
  // })
  // geoJSON.findOne({_id: req.body._id}, function(err, result){
  //   console.log(result)
  // })
  console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')

})









// // Creates database of individual geoJSON features
// ...geoJSON.findOne({}, function(err, data){
//   if (err) throw err;
//   data.geojson.features.forEach(function(feature){
//     geoIndividual.insert(feature);
//   })
// })















module.exports = router;
