var Similar = require('../services/similar'),
	sms = require('../services/sms'),
	http = require('http'),
	util = require('../services/util'),
	_ = require('underscore');

/*---------------------
	:: Party 
	-> controller
---------------------*/
var PartyController = {

	// To trigger this action locally, visit: `http://localhost:port/party/create`
	create: function (req,res,next) {
		Party.findAll().done(function(err, parties) {
			if(err || !parties) parties = [];
			var name = req.param('name'),
				id = parties.length + 1;
			// URI to slug if name
			if(name && name.length) {
				uri = name.toLowerCase().replace(/ /g,'-').replace(/[^\w-]+/g,'');
			} else {
				//else we make it "p<ID>"
				uri = "p" + id;
				name = "Fabulous Party";
			}
			// Check if there's a party with the same slug, and tack the ID on the end if so
			if(_.where(parties, { uri : uri }).length > 0) uri += "-" + id;

			sms.setHost(req.params.phone);
			sms.send(req.params.phone, 'Scha-wing! http://partyonwayne.co/p/'+uri);

			req.params.uri = uri;
			req.params.name = name;
			next();
		});
	},

	view: function(req,res,next) {
		if(!req.param('uri')) next();
		Party.findByUri(req.param('uri')).done(function(err, party) {
			if(err) return res.view('500', 500);
			if(!party) return res.view('404', 404);

			User.findAllByPartyId(party.id).done(function(err,users) { party.user_count = users.length; });
			Track.findAllByPartyId(party.id).done(function(err,tracks) { party.track_count = tracks.length; });

			// Use this once countBy* is fixed
			// User.countByPartyId(party.id).done(function(err,len) { party.user_count = len; });
			// Track.countByPartyId(party.id).done(function(err,len) { party.track_count = len; });

			res.view('party/view', { party : party, user : req.session.user });
		});
	},

	similar: function(req,res,next) {
		if(!req.param('id')) return res.view('404', 404);

		var partyId = parseInt(req.param('id'));

		Track.findAllByPartyId(partyId).done(function(err, tracks) {
			if(err) return res.view('500', 500);
			if(!tracks) return res.view('404', 404);

			var artists = [],
				count = (req.param('count')) ? req.param('count') : 20;

			// pick artists from the current playlist
			for(i=0; i < tracks.length && artists.length < 3; i++) {
				var r = Math.floor(tracks.length * Math.random());

				if(tracks[r].artist.indexOf(',') === -1 && !_.contains(artists, tracks[r].artist))
					artists.push(tracks[r].artist);
			}

			similar.get(artists, count, function(err, tracks) {
				if(err) return res.json({"message" : "Something went wrong."}, 302);

				tracks = _.map(tracks, function(track) {
					track.partyId = partyId;
					return track;
				})

				util.createTracks(req, tracks, 1000);
			});
		});

		// need to call this or Mast will keep requesting
		res.send(200);
	}
};
module.exports = PartyController;