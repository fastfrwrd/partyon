Mast.registerModel('Party', {
    urlRoot: '/party',
})

Mast.Component = Mast.Component.extend({
  show: function() {
    this.$el.removeClass('hide');
  },
  hide: function() {
    this.$el.addClass('hide');
  }
})

Mast.registerComponent('New', {
    outlet: '#app',
    template: '.new',

    events: {
      'change input': 'inputChanged',
      'submit form': 'submitPressed'
    },

    afterRender: function() {
      this.$phone = this.$el.find('#inputPhone');
      this.$title = this.$el.find('#inputTitle');
      this.$actions = this.$el.find('.form-actions');
      this.$form = this.$el.find('form');

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

      var data = this.$form.serializeObject();
      app.createParty(data);
    }
})

Mast.registerComponent('Party', {
  outlet: '#app',
  template: '.party',
  model: 'Party',
  subscriptions: {
    '~party/:id/update': function (id, data) {
      this.model.set(data);
      this.render();
    }
  }
})