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

		req.params.uri = generateUri(req.param('name'), Party.findAll().length + 1);
		next();
	}

};
module.exports = PartyController;