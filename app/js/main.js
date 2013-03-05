(function($) {
	var init = function() {
		$('input.phone').mask('(999) 999-9999');
		$('.new-party').click(function(ev) {
			$('.new-party .create-party').toggleClass('hide');
		});
	},

	party = {
		create : function() {},
		destroy : function() {}
	};

	$(function() {
		init();
	});
})(jQuery);