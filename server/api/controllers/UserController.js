var fs = require("fs");
/*---------------------
	:: User 
	-> controller
---------------------*/
var UserController = {
	getPhoto: function (req,res) {
		try {
			var img = fs.readFileSync('public/img/upload/' + req.param('id') + '.png');
			res.writeHead(200, {'Content-Type': 'image/png' });
			res.end(img, 'binary');
		} catch(err) {
			return res.view('404', 404);
		}
	},

	uploadPhoto: function (req,res) {
		var base64Data = req.param('data').replace(/^data:image\/png;base64,/,""),
			partyId = req.param('partyId');

		User.create({}).done(function(err, user) {
			if(err) return res.json({"message" : "user creation failed"}, 500);

			var imgUrl = "public/img/upload/" + user.id + ".png";
			fs.writeFile(imgUrl, base64Data, 'base64', function(err) {
				if(err) return res.json({"message" : "file upload failed"}, 500);

				User.update({id:user.id}, {partyId:partyId}, function(err, user) {
					if(err) return res.json({"message" : "user update failed"}, 500);

					_.extend(req.session, {
						authenticated: true,
						user: user
					});

					// update party count
					Party.find({ id: partyId }, function(err, party) {
						Party.update({ id: partyId }, { user_count: party.user_count+1 }, function(err, updated_party) {

							// publish user_count update to party
							Party.publish(req, {
								id: updated_party.id
							}, {
								uri: Party.identity + '/' + updated_party.id + '/update',
								data: updated_party.values
							});

							// return user as response
							res.json(user, 200);
						});
					});
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


	// keep track of users on party object and publish change in user_count to parties
	switchParty: function(req,res) {
		Party.findById(req.param('id')).done(function(err,party) {
			if(err) return res.json({ "message" : "server error"}, 500);
			if(!party) return res.json({ "message" : "party not found"}, 404);
			if(!req.session.authenticated) return res.json({"message" : "must be authenticated"}, 403);

			// find old party and decrement user_count
			// #TODO refactor room switch, probably put in util
			Party.find({ id: req.session.user.partyId }, function(err, old_party) {
				Party.update({ id: old_party.id }, { user_count: old_party.user_count-1 }, function(err, updated_old_party) {

					// publish user_count update to old party
					// #TODO refactor all of these and put into util
					Party.publish(req, {
						id: updated_old_party.id
					}, {
						uri: Party.identity + '/' + updated_old_party.id + '/update',
						data: updated_old_party.values
					});

					// increment new party user_count
					Party.update({ id: party.id }, { user_count: party.user_count+1 }, function(err, updated_new_party) {

						// publish user_count update to new party
						Party.publish(req, {
							id: updated_new_party.id
						}, {
							uri: Party.identity + '/' + updated_new_party.id + '/update',
							data: updated_new_party.values
						});

						// update user's partyId
						User.update({id:req.session.user.id}, {partyId:updated_new_party.id}, function(err,updated_user) {
							if(err) return res.json({"message":"error saving user"}, 500);
							req.session.user = updated_user;
							return res.json(updated_user, 200);
						});
					});
				});
			});
		});
	}
};
module.exports = UserController;