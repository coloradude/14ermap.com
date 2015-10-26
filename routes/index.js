var express = require('express');
var router = express.Router();
var db = require('monk')(process.env.MONGOLAB_URI || "mongodb://localhost/fourteeners");
var peaks = db.get('peaks');
var routes = db.get('routes')
var trailheads = db.get('trailheads')
var geoJSON = db.get('geoJSON')
var geoIndividual = db.get('geojson-individual')
var geoAggregate = db.get('geo-aggregate')
var geoAggregatePeaks = db.get('geo-aggregate-peaks')
var fs = require('fs')
var rp = require('request-promise')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/sort', function(req, res){
  res.render('sort')
})

router.post('/peak/:id', function(req, res){
  console.log('got it')
  Promise.all([
    routes.find({peakKeys: req.body.pkKey}),
    trailheads.find({pkKeys: req.body.pkKey}),
    rp('http://api.openweathermap.org/data/2.5/forecast?lat=' + req.body.latitutde + '&lon=' + req.body.longitude + '&cnt=5&APPID=9168266ea473f720024dc6501a3dec27')
  ]).then(function(results){
    res.render('peak', {
      peak: req.body, 
      routes: results[0], 
      trailheads: results[1], 
      weather: JSON.parse(results[2]).list
    })
  })
})

router.get('/trailhead/:id', function(req, res){
  trailheads.findOne({_id: req.params.id}).then(function(trailhead){
    return Promise.all([
      routes.find({trailheadKey: trailhead.thKey}),
      peaks.find({pkKey: {$in: trailhead.pkKeys}})
    ]).then(function(results){
      return [trailhead, results[0], results[1]]
    })
  }).then(function(data){
    res.render('trailhead', {
      trailhead: data[0], 
      routes: data[1], 
      peaks: data[2]
    })
  })
})

router.get('/route/:id', function(req, res){
  routes.findOne({_id: req.params.id}).then(function(route){
    return Promise.all([
      trailheads.find({thKey: route.trailheadKey}),
      peaks.find({pkKey: { $all: route.peakKeys }})
    ]).then(function(result){
      return [route, result[0][0], result[1]]
    })
  }).then(function(data){
    res.render('route', { 
      route: data[0], 
      trailhead: data[1], 
      peaks: data[2] 
    })
  })
})

// router.get('/geoJSON', function(req, res){
//   geoAggregatePeaks.findOne({}, function(err, geoJSON){
//     res.send(geoJSON);
//   })
// })

router.get('/geoJSON', function(req, res){
  geoAggregate.find({})
  .then(function(geoJSON){
    res.send(geoJSON);
  })
})


router.get('/update-feature/:id', function(req, res){
  geoIndividual.findOne({id: req.params.id}, function(err, result){
    console.log(result)
      res.render('update-form', {data: result}, function(err, html){
        if (err) throw err;
        res.send(html)
      })
  })
})

router.post('/update-feature/:id', function(req, res){
  if (req.body.type){

  geoIndividual.findOne({id: req.body.id}, function(err, doc){
    var replacement = doc
    console.log(replacement)
    if (req.body._id) {replacement._id = req.body._id}
    if (replacement.properties.name){ replacement.properties.name = req.body.name }
    replacement.properties.type = req.body.type
    delete replacement.properties.desc
    delete replacement.properties.ele
    delete replacement.properties.title
    delete replacement.properties.sym
    geoIndividual.remove({id: req.body.id})
    geoIndividual.insert(replacement)
    console.log(replacement)

    if (req.body.type === 'peak'){
      peaks.findById( req.body._id, function(err, result){
        if (req.body.thumbnail){ 
          result.thumbnail = req.body.thumbnail
        } 
        if (req.body.images.length > 0){
          result.images = req.body.images.split(' ')
        }
        peaks.remove({_id: req.body._id})
        peaks.insert(result)

        geoIndividual.find({}, function(err, result){
          var newgeoJSON = {
          _id : '561d7484cf3b8b983b065d90',
          geojson : {
              type : 'FeatureCollection',
              features : [] 
            }
          }
          result.forEach(function(feature){
            newgeoJSON.geojson.features.push(feature)
          })
          geoJSON.remove({})
          geoJSON.insert(newgeoJSON)
        })

      })
    }
    if (req.body.type === 'trailhead'){
      trailheads.findById( req.body._id, function(err, result){
        
        if (req.body.thumbnail){ result.thumbnail = req.body.thumbnail}
        if (req.body.images.length > 0){
          result.images = req.body.images.split(' ')
        }
        trailheads.remove({ _id: req.body._id })
        trailheads.insert(result)
        geoIndividual.find({}, function(err, result){
          var newgeoJSON = {
          _id : '561d7484cf3b8b983b065d90',
          geojson : {
              type : 'FeatureCollection',
              features : [] 
            }
          }
          result.forEach(function(feature){
            newgeoJSON.geojson.features.push(feature)
          })
          geoJSON.remove({})
          geoJSON.insert(newgeoJSON)
        })
      })
    }
    if (req.body.type === 'route'){
      routes.findById( req.body._id, function(err, result){
        if (req.body.thumbnail){ 
          result.thumbnail = req.body.thumbnail
        }
        result.isStandard = JSON.parse(req.body.isStandard)
        result.isSnowOnly = JSON.parse(req.body.isSnowOnly)
        if (req.body.images.length > 0){ 
          result.images = req.body.images.split(' ')
        }
        routes.remove({_id: req.body._id})
        routes.insert(result)

        geoIndividual.find({}, function(err, result){
          var newgeoJSON = {
          _id : '561d7484cf3b8b983b065d90',
          geojson : {
              type : 'FeatureCollection',
              features : [] 
            }
          }
          result.forEach(function(feature){
            newgeoJSON.geojson.features.push(feature)
          })
          geoJSON.remove({})
          geoJSON.insert(newgeoJSON)
        })
      })
    }
  })
}
})

router.post('/delete/:type/:id', function(req, res){
  if (req.params.type === 'peak'){
    peaks.remove({_id: req.params.id})
  } else if (req.params.type === 'peak'){
    trailheads.remove({_id: req.params.id})
  } else if (req.params.type === 'route'){
    routes.remove({_id: req.params.id})
  }
})

//router.get('something', function(req, res){
  // peaks.find({}, function(err, peaks){
  //   peaks.forEach(function(peak){
  //     geoIndividual.findById(peak._id, function(err, geoFeature){
  //       if (err) throw err;
  //       if  (!geoFeature){console.log(peak.name)}
  //       if (geoFeature){
  //         geoFeature.data = peak;
  //         geoAggregate.insert(geoFeature)
  //       }
  //     })
  //   })
  // })
//})


// // Removes mongo id from properties and adds it to the base feature object
// ...geoIndividual.find({}, function(err, result){
//   var newgeoJSON = {
//   _id : '561d7484cf3b8b983b065d90',
//   geojson : {
//       type : 'FeatureCollection',
//       features : [] 
//     }
//   }
//   result.forEach(function(feature){
//     newgeoJSON.geojson.features.push(feature)
//   })
//   geoJSON.remove({})
//   geoJSON.insert(newgeoJSON)
// })

// ...geoAggregate.find({}, function(err, result){
//   var newgeoJSON = {
//   _id : '561d7484cf3b8b983b065d90',
//   geojson : {
//       type : 'FeatureCollection',
//       features : [] 
//     }
//   }
//   result.forEach(function(feature){
//     newgeoJSON.geojson.features.push(feature)
//   })
//   geoAggregatePeaks.remove({})
//   geoAggregatePeaks.insert(newgeoJSON)
// })

// //Creates database of individual geoJSON features
// ...geoJSON.findOne({}, function(err, data){
//   if (err) throw err;
//   data.geojson.features.forEach(function(feature){
//     geoIndividual.insert(feature);
//   })
// })











module.exports = router;
