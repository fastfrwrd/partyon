var fs = require("fs");
/*---------------------
	:: User 
	-> controller
---------------------*/
var UserController = {
	getPhoto: function (req,res) {
		try {
			var img = fs.readFileSync('assets/img/upload/' + req.param('id') + '.png');
			res.writeHead(200, {'Content-Type': 'image/png' });
			res.end(img, 'binary');
		} catch(err) {
			return res.view('404', 404);
		}
	},

	uploadPhoto: function (req,res) {
		var base64Data = req.param('data').replace(/^data:image\/png;base64,/,"");

		User.create({}).done(function(err, user) {
			if(err) return res.json({"message" : "user creation failed"}, 500);

			var imgUrl = "assets/img/upload/" + user.id + ".png";
			fs.writeFile(imgUrl, base64Data, 'base64', function(err) {
				if(err) return res.json({"message" : "file upload failed"}, 500);

				User.update({id:user.id}, {partyId:req.param('partyId')}, function(err, user) {
					if(err) return res.json({"message" : "user update failed"}, 500);

					_.extend(req.session, {
						authenticated: true,
						user: user
					});
					return res.json(user, 200);
				});
			});
		});
	},

	login: function(req,res,next) {
		if(req.originalUrl.indexOf('p/') !== 0) return res.redirect('/');
		next();
	},

	logout: function(req,res) {
		delete req.session.user;
		delete req.session.authenticated;
		res.redirect('/');
	},

	switchParty: function(req,res) {
		Party.findById(req.param('id')).done(function(err,party) {
			if(err) return res.json({ "message" : "server error"}, 500);
			if(!party) return res.json({ "message" : "party not found"}, 404);
			if(!req.session.authenticated) return res.json({"message" : "must be authenticated"}, 403);

			User.update({id:req.session.user.id}, {partyId:party.id}, function(err,user) {
				if(err) return res.json({"message":"error saving user"}, 500);
				req.session.user = user;
				return res.json(user, 200);
			});
		});
	}
};
module.exports = UserController;