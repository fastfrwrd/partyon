define([
	'order!libs/mast/socketio',
	'underscore',
	'jquery',
	'order!libs/backbone/backbone.min',
	'order!libs/mast/json2',
	'order!libs/mast/mast.dev'
], function(Socket, _, $) {
	return {
		Backbone : Backbone,
		Mast : Mast
	};
});