module.require('underscore');
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
				Track.update({id : track.id}, { votes : ++track.votes }, function(err, track) {
					if(err) return res.json(err, 500);
					else return res.json(track, 200);
				});
			} else {
				req.params.userId = req.session.user.id;
				next();
			}
		});
	}

};
module.exports = TrackController;