define([
    'jquery',
    'underscore',
    'backbone',
    'mast'
], function($, _, Backbone, Mast) {
  Mast.registerComponent('New', {
    template: '.new',
    events: {
      'change input': 'inputChanged',
      'submit form': 'submitPressed'
    },
    afterRender: function() {
      this.$phone = this.$('#inputPhone');
      this.$title = this.$('#inputTitle');
      this.$actions = this.$('.form-actions');
      this.$form = this.$('form');

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
  });
});