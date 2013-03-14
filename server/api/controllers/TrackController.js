var request = require('request'),
	util = require('../services/util');


/*---------------------
	:: Track 
	-> controller
---------------------*/
var TrackController = {

	// To trigger this action locally, visit: `http://localhost:port/track/create`
	create: function (req,res,next) {
		var trackUri = req.param('trackUri'),
			partyId = req.param('partyId');

		util.trackExists( trackUri, partyId, function(model) {
			if (model) {
				util.upvoteTrack(model);
			} else {
				next();
			}
		})
	},

	suggest: function(req,res,next) {
		var pageData = "";
		request({
			url: 'http://ws.spotify.com/search/1/track.json?q=' + req.param('q'),
			json: true
		}, function(err,response,body) {
			res.send(body, response.statusCode);
		});
	},

	lookup: function(req,res,next) {
		var links = req.param('spotify'),
			partyId = req.param('partyId');

		util.doLookups(links, function(tracks) {

			tracks = _.map(tracks, function(track) {
				return {
					trackUri: track.track.href,
					partyId: partyId,
					artist: _.pluck(track.track.artists, 'name').join(', '),
					title: track.track.name
				}
			})

			util.createTracks(req, tracks, 1000);

		})
	}

};
module.exports = TrackController;