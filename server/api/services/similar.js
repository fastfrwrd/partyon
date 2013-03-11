var echonest = require('echonest'),
	request = require('request'),
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

			var host = 'http://developer.echonest.com',
				path = '/api/v4/playlist/static';

			var q = '?api_key='+global.sails.config.echonest.api_key;
			artists.forEach(function(el) {
				q += '&artist='+encodeURIComponent(el);
			})
			q += '&format=json';
			q += '&results='+count;
			q += '&bucket=tracks';
			q += '&bucket=id:spotify-WW';
			q += '&limit=true';
			q += '&type=artist';
			q += '&dmca=true';

			request({
				url: host + path + q,
				json: true
			}, function(err,response,body) {

				if (err || !body.response.songs) return cb(err);
				
				var songs = body.response.songs,
					songsFormatted = [];

				songs.forEach(function(song) {
					songsFormatted.push({
						trackUri : _.first(song.tracks).foreign_id.replace('spotify-WW','spotify'),
						title : song.title,
						artist : song.artist_name
					});
				});

				cb(false, songsFormatted);

			});
		}
	};

module.exports = Similar;