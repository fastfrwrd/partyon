var echonest = require('echonest'),
	Similar = {
		nest : new echonest.Echonest({
			api_key : global.sails.config.echonest.api_key
		}),

		get : function(artists, count, cb) {
			if(!artists) {
				cb(true);
				return false;
			}

			var self = this;

			self.nest.playlist.static({
				artist : artists.join(','),
				type : 'artist-radio',
				bucket : ["id:spotify-WW","tracks"],
				limit : true,
				results : count,
				dmca : true
			}, function(err, nestRes) {
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