module.require('underscore');
var http = require('http');

/*---------------------
	:: Track 
	-> controller
---------------------*/
var TrackController = {

	// To trigger this action locally, visit: `http://localhost:port/track/create`
	create: function (req,res,next) {
		Track.find({
			trackUri : req.param('trackUri'),
			partyId : req.param('partyId')
		}).done(function(err, track) {
			if(err) res.json({err:err}, 500);
			if(track) {

				// LOOK AT THIS CRAZY!
				var request = http.request({
					hostname: global.sails.config.host,
					port: global.sails.config.port,
					method: 'PUT',
					path: '/track/'+track.id,
					headers: { 'content-type': 'application/json' }
				});
				var body = { votes : ++track.votes };
				request.write(JSON.stringify(body));
				request.end();

				// THIS DOESN'T BROADCAST THE VOTE CHANGE TO CLIENTS :(
				// Track.update({id : track.id}, { votes : ++track.votes }, function(err, track) {
				// 	if(err) return res.json(err, 500);
				// 	else return res.json(track, 200);
				// });

			} else next();
		});
	}

};
module.exports = TrackController;