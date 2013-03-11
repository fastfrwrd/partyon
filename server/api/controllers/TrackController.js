var request = require('request'),
	http = require('http'),
	util = require('../services/util');

/*---------------------
	:: Track 
	-> controller
---------------------*/
var TrackController = {

	// To trigger this action locally, visit: `http://localhost:port/track/create`
	create: function (req,res,next) {

		util.findAndCreate( req.param('trackUri'), req.param('partyId'), function(err) {
			if (err) next()
		});
	},

	suggest: function(req,res,next) {
		var pageData = "";
		request({
			url: 'http://ws.spotify.com/search/1/track.json?q=' + req.param('q'),
			json: true
		}, function(err,response,body) {
			res.send(body, response.statusCode);
		});
	}

};
module.exports = TrackController;