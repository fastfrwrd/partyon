module.exports = function(req, res, next) {
	// format URI
	var uri = req.originalUrl.substr(3);
	if(uri.charAt(uri.length - 1) === "/") uri = uri.substr(0, uri.length - 1);

	Party.findByUri(uri).done(function(err,party) {
		// server error
		if(err) return res.view('500', 500);
		// no party here
		if(!party) return res.view('404', 404);

		// if the user is logged into this party, let em in
		if(req.session.authenticated && party.id === req.session.user.partyId) return next();
		// if not, prompt them to login
		else res.view('user/login', { party : party, user : req.session.user });
	});
};