var Templates = {
	snapshot :
		'<div class="snapshot">' +
			'<div class="well">' +
				'<div class="preview">' +
					'<h5>To sign in, we\'re gonna take a screenshot of you. <em>No joke!</em></h5>' +
					'<video autoplay width="640"></video>' +
					'<div class="button-row">' +
						'<button class="take btn btn-large btn-block hide">Oh snap!</button>' +
					'</div>' +
				'</div>' +
				'<div class="view hide">' +
					'<canvas width="640" height="480"></canvas>' +
					'<div class="button-row">' +
						'<button class="upload btn btn-large btn-primary pull-right">Party On!</button>' +
						'<button class="retake btn btn-large pull-left">Retake</button>' +
						'<div class="clearfix">' +
					'</div>' +
				'</div>' +
				'<div class="wait hide">' +
					'<div class="progress">' +
						'<div class="bar" style="width: 40%;"></div>' +
					'</div>' +
				'</div>' +
			'</div>' +
		'</div>',

	spotifyItem :
		'<a href="#">' +
			'<h5 class="name">{{ name }}</h5>' +
			'<span class="artist">{{# artists }}{{^ first }}, {{/ first }}{{ name }}{{/ artists }}<span>' +
		'</a>'
};

_.each(Templates, function(t, key) { Templates[key] = Hogan.compile(t); });
