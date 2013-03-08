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
			if(Party.findByName(uri).length) uri += "-" + id;

			req.params.uri = uri;
			req.params.name = name;
			next();
		});
	},

	view: function(req,res,next) {
		if(!req.param('uri')) next();
		Party.findByUri(req.param('uri')).done(function(err, party) {
			if(err) return res.view('500');
			if(!party) return res.view('404');

			User.findAllByPartyId(party.id).done(function(err,users) { party.users = users; });
			Track.findAllByPartyId(party.id).done(function(err,tracks) { party.tracks = tracks; });

			res.view('party/view', { party : party });
		});
	},

	tracks: function(req,res,next) {
		if(req.param('id')) {
			Track.findAllByPartyId(req.param('id')).done(function(err,tracks) {
				if(err) return res.json({"message" : "server error"}, 500);
				return res.json(_.map(tracks, function(t) { return _.omit(t, 'values'); }), 200);
			});
		} else return res.json([], 200);
	}

};
module.exports = PartyController;