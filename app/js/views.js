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
    'submit form': 'submitPressed'
  },

  initialize: function($el) {
    this.setElement($el);

    this.$phone = $el.find('#inputPhone');
    this.$title = $el.find('#inputTitle');
    this.$actions = $el.find('.form-actions');
    this.$form = $el.find('form');

    this.$phone.mask('(999) 999-9999');
  },

  inputChanged: function() {

    if (!this.validate()) {
      this.$actions.removeClass('show');
      return;
    }

    this.$actions.addClass('show');
  },

  validate: function() {
    return this.$phone.val() != '' && this.$title.val() != '';
  },

  submitPressed: function(e) {
    e.preventDefault();
    var req = this.$form.doTheAjax()
    req
      .done(_.bind(app.createParty, app))
      .error(function(req, err) {
        console.error(err)
      });
  }

});


var Queue = BaseView.extend({

  template: _.template('<article class="queue hide"><h3 class="title">Queue</h3><ul class="list"><li><span class="name">212</span><span class="etc">- Azealia Banks, Lazy Jay</span><span class="pull-right">8.1</span></li></ul></article>'),

  render: function() {
    console.log(this.model.toJSON());
    var $el = $(this.template(this.model.toJSON()));
    this.setElement($el);
    return this;
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
    this.queue = new Queue();
    this.history = new History($el.find('.history'));

    this.new.show()

  },

  createParty: function(data) {
    var p = new Party(data);
    this.queue.model = p;
    var $queue = this.queue.render().$el
    this.new.$el.after($queue);
    app.queue.show();
    this.new.hide();
  }

});