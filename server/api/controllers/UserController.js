var fs = require("fs");
/*---------------------
	:: User 
	-> controller
---------------------*/
var UserController = {
	uploadPhoto: function (req,res) {
		var base64Data = req.body.data.replace(/^data:image\/png;base64,/,"");

		User.create({}).done(function(err, user) {
			if(err) return res.json({"message" : "user creation failed"}, 500);

			var imgUrl = "assets/img/upload/" + user.id + ".png";
			fs.writeFile(imgUrl, base64Data, 'base64', function(err) {
				if(err) return res.json({"message" : "file upload failed"}, 500);

				User.update({id:user.id}, {imgUrl:imgUrl}, function(err, user) {
					if(err) return res.json({"message" : "user update failed"}, 500);
					return res.json(user, 200);
				});
			});
		});
	},
	getPhoto: function (req,res) {
		var img;
		try {
			img = fs.readFileSync('assets/img/upload/' + req.param('id') + '.png');
			res.writeHead(200, {'Content-Type': 'image/png' });
			res.end(img, 'binary');
		} catch(err) {
			return res.view('404', 404);
		}
	}
};
module.exports = UserController;