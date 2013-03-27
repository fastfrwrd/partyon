require([
    'js/trees/tracklist',
    'js/models/party'
], function(Tracklist, Party) {
  Mast.registerComponent('Party', {
    template: '.party',
    model: 'Party',
    regions: {
      '.track-list': 'TrackList'
    },
    events : {
      "click .similar" : 'similar'
    },
    similar : function(ev) {
      ev.preventDefault();
      Mast.Socket.request('/party/similar', { id: this.model.id }, $.noop);
    },
    subscriptions: {
      '~party/:id/update': function (id, attributes) {
        this.set(this.model.changedAttributes(attributes));
      }
    },
    bindings: {
      // You need bindings to each changed attribute or else Mast will
      // re-render the entire component. re: updatedAt
        'updatedAt'  : $.noop,
        'name'       : function(newValue) { this.$name.text(newValue); },
        'user_count' : function(newValue) { this.$user_count.text(newValue); }
    },
    afterRender: function() {
      // this is called when setting attributes, but we only want it called once after init
      if (this.rendered) return;
      this.rendered = true;
      this.$name = this.$('.party-name' );
      this.$user_count = this.$('.user-count' );
      this.$track_count = this.$('.track-count');
      var $input = this.$('.title .uri input');
      $input.val(Mast.Socket.baseurl + "p/" + $input.val());
    }
  });
});