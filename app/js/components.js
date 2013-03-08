Mast.registerModel('Party', {
    urlRoot: '/party',
})
Mast.registerModel('Track')

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
  // subscriptions: {
  //   '~party/:id/update': function (id, data) {
  //     this.model.set(data);
  //     this.render();
  //   }
  // },
  regions: {
    '.track-list': 'TrackList'
  }
})

Mast.registerCollection('Tracks', {
  url : '/track',
  model : 'Track',
  autoFetch: false,
  comparator: function(track) {
    return -track.get('votes');
  }
});

Mast.registerTree("TrackList", {
  template : '.empty',
  collection : "Tracks",
  branchComponent : "TrackListItem",
  emptyHTML: "<li>No tracks yet for this party.</li>",
  loadingHTML: "<li>Loading...</li>",
  errorHTML: "<li>There was an error retrieving tracks. Bummer, dude.</li>",
  init: function() {
    this.partyId = this.parent.model.id;
    this.fetchCollection({ partyId : this.partyId });
  }
});

Mast.registerComponent('TrackListItem', {
  template: '.party-track'
});