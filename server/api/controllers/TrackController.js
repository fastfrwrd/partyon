var request = require('request'),
	util = require('../services/util');


/*---------------------
	:: Track 
	-> controller
---------------------*/
var TrackController = {

	// To trigger this action locally, visit: `http://localhost:port/track/create`
	create: function (req, res, next) {
		var trackUri = req.param('trackUri'),
			partyId = req.param('partyId');

		util.trackExists( trackUri, partyId, function(model) {
			if (model) {
				util.upvoteTrack(req, model);
			} else {
				next();
			}
		})
	},

	createMany: function(req, res, next) {
		var userId = req.param('userId'),
			partyId = req.param('partyId'),
			links = req.param('links');

		util.lookupMany(links, function(tracks) {

			tracks = _.map(tracks, function(track) {
				return {
					trackUri: track.track.href,
					artist: _.pluck(track.track.artists, 'name').join(', '),
					title: track.track.name,
					partyId: partyId,
					userId: userId
				}
			})

			util.createTracks(req, tracks, 1000);
		})
	},

	suggest: function(req, res) {
		util.search('track', req.param('q'), function(err, response, body) {
			res.send(body, response.statusCode);
		}, false);
	}

};
module.exports = TrackController;