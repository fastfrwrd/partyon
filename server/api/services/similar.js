var http = require("http"),
	qs = require("qs");

var Similar = {
		get : function(artists, count, cb) {
			if(!artists) {
				cb(true);
				return false;
			}

			var self = this,
				q = qs.stringify({
					artist : artists.join(','),
					type : 'artist-radio',
					bucket : ["id:spotify-WW","tracks"],
					limit : true,
					results : count,
					dmca : true
				}),
				url = "http://developer.echonest.com/api/v4/playlist/static?";

			http.get(url + q, function(nestRes) {
				if(err || !nestRes) {
					cb(self, true);
					return;
				}
				console.log(nestRes);
				if(nestRes.status.code === 5) { // the artist string sucked, recurse to a shorter one
					return self.get(_.first(artists, artists.length - 1), count, cb);
				}

				// we got a good result;
				var songsToAdd = [];

				_.each(nestRes.songs, function(s) {
					var obj = {
						trackUri : _.first(s.tracks).foreign_id.replace('spotify-WW','spotify'),
						title : s.title,
						artist : s.artist_name
					};

					songsToAdd.push(obj);
				});

				cb(false, songsToAdd);
				return Similar;
			});
		}
	};

module.exports = Similar;