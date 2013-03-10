var echonest = require('echonest');
var sails = require('sails');

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
				newTracks = (req.param('count')) ? req.param('count') : 20;

			// pick artists better
			for(i=0; i < tracks.length && artists.length < 5; i++) {
				var randoCalrissian = Math.floor(tracks.length * Math.random());
				console.log(randoCalrissian, tracks.length);
				if(tracks[randoCalrissian].artist.indexOf(',') === -1 && !_.contains(artists, tracks[i].artist))
					artists.push(tracks[i].artist);
			}

			console.log(artists);
			// hit echonest and get similar songs
			var myNest = new echonest.Echonest({
				api_key : 'XXXXXXXXXX'  // need to dynamically get this
			});

			myNest.playlist.static({
				artist : artists.join(','),
				type : 'artist-radio',
				bucket : ["id:spotify-WW", "tracks"],
				limit : true,
				results : newTracks,
				dmca : true
			}, function(err, nestRes) {
				if(err || !nestRes) return res.json({}, 500);


				var songsToAdd = [];
				_.each(nestRes.songs, function(s) {
					var obj = {
						trackUri : _.first(s.tracks).foreign_id.replace('spotify-WW','spotify'),
						name : s.name,
						artist : s.artist_name,
						userId : -1,
						partyId : req.param('id'),
						votes : 1
					};

					Track.create(obj).done(function(err,track) {
						songsToAdd.push(track);
					});
				});

				return res.json({songs : songsToAdd}, 200);
			});
		});
	}
};
module.exports = PartyController;