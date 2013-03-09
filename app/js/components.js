Mast.registerModel('Party', {
    urlRoot: '/party',
})
Mast.registerModel('Track')

Mast.registerComponent('New', {
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
  template: '.party',
  model: 'Party',
  autoRender: false,
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

Mast.registerComponent('TrackListItem', {
  template: '.party-track'
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
  },
  subscriptions: {
    '~track/create': function (track) {
      if (track.partyId != this.partyId) return;
      this.collection.add(track);
    },
    '~track/:id/update': function (id, attributes) {
      this.collection.get(id).set(attributes);
      this.collection.sort();
      this.render();
    }
  },
});



Mast.registerComponent('App', {
  outlet: '#app',
  template: '.panes',
  regions: {
    '.new-container': 'New',
    '.party-container': 'Party'
  },
  createParty: function(data) {
    var party = new Mast.models.Party(data);
    party.save(null, {
      success: function(model) {
        app.child('.new-container').close();
        var party = app.child('.party-container');
        party.model = model;
        party.append();
      }
    })
  }
})