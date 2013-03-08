var Templates = {
	// Hogan Templates
	snapshot :
		'<div class="snapshot">' +
			'<div class="well" style="margin-top:20px">' +
				'<div class="preview hide">' +
					'<h5>To sign in, we\'re gonna take a screenshot of you. <em>No joke!</em></h5>' +
					'<video width="640"></video>' +
					'<div class="button-row">' +
						'<button class="take btn btn-large btn-block">Oh snap!</button>' +
					'</div>' +
				'</div>' +
				'<div class="upload hide">' +
					'<h5>Here we need to do photo upload.</h5>' +
				'</div>' +
				'<div class="view hide">' +
					'<h5>To save your image, crop it and click "Party On!"</h5>' +
					'<div class="canvas-wrapper"><canvas width="640" height="480"></canvas></div>' +
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

// Mast Templates
_.extend(Templates, {
	trackItem  : '<li>' +
		'<span class="user"><img src="/user/{{ userId }}/img" /></span>' +
		'<span class="name"><a href="{{ trackUri }}">{{ title }}</a></span>' +
		'<span class="etc"><small>by</small> {{ artist }}</span>' +
		'<span class="pull-right">{{ votes }} <small>votes</small></span>' +
	'</li>'
});