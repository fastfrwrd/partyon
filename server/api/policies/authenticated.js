module.exports = function(req, res, next) {
	var uri = req.originalUrl.substr(3);
	if(uri.charAt(uri.length - 1) === "/") uri = uri.substr(0, uri.length - 1);

	Party.findByUri(uri).done(function(err,party) {
		if(err) return res.view('500', 500);
		if(!party) return res.view('404', 404);

		if(req.session.authenticated && party.id === req.session.user.partyId) return next();
		else {
			res.view('user/login', { party : party });
		}
	});
};