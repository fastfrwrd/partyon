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

			res.view('party/view', { party : party, user : req.session.user });
		});
	}
};
module.exports = PartyController;