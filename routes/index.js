var express = require('express');
var router = express.Router();
var db = require('monk')(process.env.MONGOLAB_URI || "mongodb://localhost/fourteeners");
var peaks = db.get('peaks');
var routes = db.get('routes')
var trailheads = db.get('trailheads')
var test = db.get('geoJSON-test')
var fs = require('fs')
var request = require('request')


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
//'http://api.openweathermap.org/data/2.5/forecast?lat=' + peak.latitude + '&lon' + peak.longitude
router.get('/peak/:id', function(req, res, next) {
  console.log('got it')
  peaks.findOne({_id: req.params.id}, function(err, peak){
    if (err) throw err;
    request('http://api.openweathermap.org/data/2.5/forecast?lat=' + peak.latitutde + '&lon=' + peak.longitude + '&cnt=5&APPID=9168266ea473f720024dc6501a3dec27', function (error, response, weather) {
      if (err) throw err;
      console.log(response)
      if (!error && response.statusCode == 200) {
        var weather = JSON.parse(weather)

        console.log(weather.list)
        routes.find({peakKeys: peak.pkKey}, function(err, routes){
          if (err) throw err;
          trailheads.find({pkKeys: peak.pkKey}, function(err, trailheads){
            if (err) throw err;
            res.render('peak', {peak: peak, routes: routes, trailheads: trailheads, weather: weather.list}, function(err, html){
              if (err) throw err;
              console.log(html)
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

module.exports = router;
