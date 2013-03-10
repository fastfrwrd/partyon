var Similar = require('../services/similar'),
	sms = require('../services/sms.js'),
	http = require('http');

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
				//else we make it "p<ID>" and 
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

			User.findAllByPartyId(party.id).done(function(err,users) { party.users = users; });
			Track.findAllByPartyId(party.id).done(function(err,tracks) { party.tracks = tracks; });

			res.view('party/view', { party : party, user : req.session.user });
		});
	},

	similar: function(req,res,next) {
		if(!req.param('id')) return res.view('404', 404);
		Track.findAllByPartyId(req.param('id')).done(function(err, tracks) {
			if(err) return res.view('500', 500);
			if(!tracks) return res.view('404', 404);

			var artists = [],
				count = (req.param('count')) ? req.param('count') : 20;

			// pick artists from the current playlist
			for(i=0; i < tracks.length && artists.length < 3; i++) {
				var randoCalrissian = Math.floor(tracks.length * Math.random());

				if(tracks[randoCalrissian].artist.indexOf(',') === -1 && !_.contains(artists, tracks[i].artist))
					artists.push(tracks[i].artist);
			}

			similar.get(artists, count, function(err, tracks) {
				if(err) {
					res.json({"message" : "Something went wrong."}, 302)
					return;
				}
				var progress = 0;
				_.each(tracks, function(t) {
					t = _.extend(t, {
						userId : -1,
						votes : 1,
						partyId : req.param('id'),
						played : false
					});

					Track.create(t).done(function(err,track) {
						progress++;
						console.log(progress, count);
						if(progress === count) res.json(tracks, 200);	
					});
				});
			});

			// res.send({"message" : "working"}, 200);
		});
	}
};
module.exports = PartyController;