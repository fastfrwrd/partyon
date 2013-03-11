var echonest = require('echonest'), 
	request = require('request'),
	Similar = {
		get : function(artists, count, cb) {
			console.log('requesting Echonest:', artists, count);
			if(artists.length === 0) return cb(true);

			var self = this;

			request.get(Similar.url(artists, count), function(err,response,json) {
				if(err) cb(true);
				else {
					var data = JSON.parse(json);
					if(data.response.status.code === 5) Similar.get(_.first(artists, artists.length - 1), count, cb);
					else {
						var songsToAdd = [];

						_.each(data.response.songs, function(s) {
							var obj = {
								trackUri : _.first(s.tracks).foreign_id.replace('spotify-WW','spotify'),
								title : s.title,
								artist : s.artist_name
							};

							songsToAdd.push(obj);
						});

						cb(false, songsToAdd);
					}
				}
			});
		},

		url : function(artists, count) {
			var url = "http://developer.echonest.com/api/v4/playlist/static?";
			url += 'api_key=' + global.sails.config.echonest.api_key;
			_.each(artists, function(a) { url += '&artist='+encodeURIComponent(a); });
			url += '&results=' + count;
			url += '&bucket=tracks';
			url += '&bucket=id:spotify-WW';
			url += '&format=json';
			url += '&limit=true';
			url += '&type=artist';
			url += '&dmca=true';

			return url;
		}
	};

module.exports = Similar;