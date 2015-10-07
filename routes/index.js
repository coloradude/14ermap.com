var express = require('express');
var router = express.Router();
var db = require('monk')(process.env.MONGOLAB_URI || "mongodb://localhost/fourteeners");
var peaks = db.get('peaks');
var routes = db.get('routes')
var trailheads = db.get('trailheads')
var test = db.get('geoJSON-test')
var fs = require('fs')


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/peak/:id', function(req, res, next) {
  peaks.findOne({_id: req.params.id}, function(err, peak){
    if (err) throw err;
    routes.find({peakKeys: peak.pkKey}, function(err, routes){
      if (err) throw err;
      trailheads.find({pkKeys: peak.pkKey}, function(err, trailheads){
        if (err) throw err;
        res.render('peak', {peak: peak, routes: routes, trailheads: trailheads}, function(err, html){
          if (err) throw err;
          res.send(html)
        })
      })
    })
    // res.send(peak[0])
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
