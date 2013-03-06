var BaseView = Backbone.View.extend({
  show: function() {
    this.$el.removeClass('hide');
  },
  hide: function() {
    this.$el.addClass('hide');
  }
});


var New = BaseView.extend({

  events: {
    'change input': 'inputChanged',
    'click #submitNew': 'submitPressed'
  },

  initialize: function($el) {
    this.setElement($el);

    this.$phone = $el.find('#inputPhone');
    this.$title = $el.find('#inputTitle');
    this.$actions = $el.find('.form-actions');
    this.$submit = this.$actions.find('#submitNew');

    this.$phone.mask('(999) 999-9999');
  },

  ready: false,

  inputChanged: function() {

    if (!this.validate()) {
      this.$actions.removeClass('show');
      return;
    }

    this.$actions.addClass('show');
  },

  submitPressed: function(e) {
    e.preventDefault();
    console.log('do something');
  },

  validate: function() {
    return this.$phone.val() != '' && this.$title.val() != '';
  }

});


var Queue = BaseView.extend({
  initialize: function($el) {
    this.setElement($el);
  }
});


var History = BaseView.extend({
  initialize: function($el) {
    this.setElement($el);
  }
});



var PartyOn = BaseView.extend({

  initialize: function($el) {

    this.new = new New($el.find('.new'));
    this.queue = new Queue($el.find('.queue'));
    this.history = new History($el.find('.history'));

    this.new.show()

  }

});