(function($) {
	var init = function() {
			// autocomplete setup
			$('.sp-search').autocomplete({
				source: function(req, res) {
					$.getJSON("http://ws.spotify.com/search/1/track.json?q=" + req.term, function(data) {
						res(_.map(_.first(data.tracks, 5), function(track) {
							if(track.artists.length > 0) track.artists[0].first = true;

							return track;
						}));
					});
				},
				select: function(ev, ui) {
					console.log(ev);
					var track = new Mast.models.Track({
						trackUri : ui.item.href,
						title : ui.item.name,
						artist : _.pluck(ui.item.artists, 'name').join(', '),
						partyId : $(ev.target).closest('article').attr('data-partyon-partyid'),
						votes : 1
					});
					track.save({}, {
						success:function(model) {
							console.log(model);
						},
						error: function() {
							console.error('error  ', arguments);
						}
					});
				}
			}).data( "ui-autocomplete" )._renderItem = function( ul, item ) {
				return $( "<li>" )
					.append( Templates.spotifyItem.render(item) )
					.appendTo( ul );
			};
		},

		/* Hogan Templates */
		Templates = {
			spotifyItem : '<a href="#" class="addTrack"><h5>{{ name }}</h5>' +
				'<span>{{# artists }}{{^ first }}, {{/ first }}{{ name }}{{/ artists }}<span></a>'
		};

	_.each(Templates, function(t, key) { Templates[key] = Hogan.compile(t); });

	$(function() { init(); });
})(jQuery);