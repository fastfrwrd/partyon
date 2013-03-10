var echonest = require('echonest'),
	http = require('http'),
	Similar = {
		// nest : new echonest.Echonest({
		// 	api_key : global.sails.config.echonest.api_key
		// }),

		get : function(artists, count, cb) {
			if(!artists) {
				cb(true);
				return false;
			}

			var self = this;

			var path = '/api/v4/playlist/static?';
			path += 'api_key='+global.sails.config.echonest.api_key;
			artists.forEach(function(el) {
				path += '&artist='+encodeURIComponent(el);
			})
			path += '&format=json';
			path += '&results='+count;
			path += '&bucket=tracks';
			path += '&bucket=id:spotify-WW';
			path += '&limit=true';
			path += '&type=artist';
			path += '&dmca=true';

			var data = '';

			var request = http.request({
				hostname: 'developer.echonest.com',
				port: '80',
				method: 'GET',
				path: path
			}, function(res) {
				res.on('data', function(chunk) {
					data += chunk;
				})
				res.on('end', function() {

					data = JSON.parse(data);

					// we got a good result;
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
				})
			});
			request.end();
		}
	};

module.exports = Similar;