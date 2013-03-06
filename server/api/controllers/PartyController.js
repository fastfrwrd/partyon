/*---------------------
	:: Party 
	-> controller
---------------------*/
var PartyController = {

	// To trigger this action locally, visit: `http://localhost:port/party/create`
	create: function (req,res,next) {
		var generateUri = function(name, id) {
			// URI to slug if name, else we make it "p<ID>"
			var uri = (name && name.length) ? name.toLowerCase().replace(/ /g,'-').replace(/[^\w-]+/g,'') : "p" + id;
			// Check if there's a party with the same slug, and tack the ID on the end if so
			if(Party.findByName(uri).length) uri += "-" + id;

			return uri;
		};

		Party.findAll().done(function(err, parties) {
			if(err || !parties) parties = [];
			req.params.uri = generateUri(req.param('name'), parties.length + 1);
		});
		next();
	},

	view: function(req,res,next) {
		if(!req.param('uri')) next();
		Party.findByUri(req.param('uri')).done(function(err, party) {
			if(err) res.send("Sad.", 500);
			if(!party) res.send("No parties dood.", 404);

			User.findAllByPartyId(party.id).done(function(err,users) { party.users = users; });
			Track.findAllByPartyId(party.id).done(function(err,tracks) { party.tracks = tracks; });

			res.json(party);
		});

	}

};
module.exports = PartyController;