var db = require('monk')(process.env.MONGOLAB_URI || "mongodb://localhost/fourteeners")
var peaks = db.get('peaks')
var routes = db.get('routes')
var trailheads = db.get('trailheads')
var rp = require('request-promise')

module.exports = {

  getPeak: function(_id){
    return peaks.findById(_id).then(function(peak){
      return Promise.all([
        routes.find({peakKeys: peak.pkKey}),
        trailheads.find({pkKeys: peak.pkKey}),
        rp('http://api.openweathermap.org/data/2.5/forecast?lat=' + peak.latitutde + '&lon=' + peak.longitude + '&cnt=5&APPID=9168266ea473f720024dc6501a3dec27')
      ]).then(function(results){
        return { peak: peak, routes: results[0], trailheads: results[1], weather: JSON.parse(results[2]).list}
      })
    })
  },

  getRoute: function(_id){
    return routes.findById(_id).then(function(route){
      return Promise.all([
        trailheads.findOne({thKey: route.trailheadKey}),
        peaks.find({pkKey: { $all: route.peakKeys }})
      ]).then(function(result){
        return {route: route, trailhead: result[0], peaks: result[1] }
      })
    })
  },

  getTrailhead: function(_id){
    return trailheads.findById(_id).then(function(trailhead){
      return Promise.all([
        routes.find({trailheadKey: trailhead.thKey}),
        peaks.find({pkKey: {$in: trailhead.pkKeys}})
      ]).then(function(results){
        return {trailhead: trailhead, routes: results[0], peaks: results[1]}
      })
    })
  }


}













