var sp = getSpotifyApi();
var models = sp.require('$api/models');
var views = sp.require('$api/views');

Mast.registerModel('Party', {
    urlRoot: '/party'
});

Mast.registerModel('Track', {
    urlRoot: '/track'
});

Mast.registerComponent('Loading', {
  template: '.loading'
});

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

Mast.registerCollection('Tracks', {
  url : '/track',
  model : 'Track',
  autoFetch: false,
  comparator: function(track) {
    return -track.get('votes');
  },
  init: function() {
    this.listenTo(this, 'reset', this.onChange);
    this.listenTo(this, 'add', this.onChange);
    this.listenTo(this, 'remove', this.onChange);
  },
  onChange: function() {
    app.party.$track_count.text(this.length);
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
    app.tracklist = this;
  },
  subscriptions: {
    '~track/create': function (track) {
      if (track.partyId != this.partyId) return;
      this.collection.add(track);
      app.playlist.add(track.trackUri);
      this.startPlaying(track);
    },
    '~track/:id/update': function (id, attributes) {
      var track = this.collection.get(id);
      track.set(attributes);
      this.collection.sort();
      this.render();
    }
  },
  startPlaying : function(track) {
    if(this.collection.size() === 1 && this.collection.first().get('trackUri') !== track.uri) {
      app.player.play(track.trackUri, app.playlist);
      app.playlist.observe(models.EVENT.CHANGE, function(ev) {
        console.log(ev);
      });
    }
  }
});

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
    $.get(this.$('.similar').attr('href'));
  },
  subscriptions: {
    '~party/:id/update': function (id, attributes) {
      this.set(attributes);
    }
  },
  bindings: {
    // You need bindings to each changed attribute or else Mast will
    // re-render the entire component. re: updatedAt
      'updatedAt' : function() {},
           'name' : function(newValue) { this.$name.text(newValue) },
     'user_count' : function(newValue) { this.$user_count.text(newValue) }
  },
  afterRender: function() {
           this.$name = this.$('.party-name' );
     this.$user_count = this.$('.user-count' );
    this.$track_count = this.$('.track-count');
    var $input = this.$('.title .uri input');
    $input.val(Mast.Socket.baseurl + "/p/" + $input.val());
  }
});

Mast.registerComponent('App', {
  outlet: '#app',
  template: '.panes',
  regions: {
    '.loading-container': 'Loading'
  },
  init: function() {
    _.bindAll(this, 'startParty')
  },
  afterConnect: function() {
    this.child('.loading-container').close();
    this.renderRegion('New', '.new-container');
  },
  createParty: function(data) {
    var party = new Mast.models.Party(data);
    party.save(null, {
      success: function(attrs) {
        // in order to subscribe to party changes, we need
        //   to fetch it from the server. idky.
        Mast.Socket.find(new Mast.models.Party(), {
            data: { id: attrs.id },
            success: app.startParty
        });
      }
    });
  },
  startParty: function(attrs) {
    this.child('.new-container').close();
    this.renderRegion('Party', '.party-container', attrs);
    app.party = app.child('.party-container');
    app.player = new views.Player();
    app.playlist = new models.Playlist();
  }
});

models.application.observe(models.EVENT.LINKSCHANGED, function(spotify) {

  var next_link = function(links, idx) {
    if (idx >= links.length) return;
    var href = links[idx];
    models.Track.fromURI(href, function(track) {
      track = track.data;
      var model = new Mast.models.Track({
                                  trackUri : track.uri,
                                  title : track.name,
                                  artist : _.pluck(track.artists, 'name').join(', '),
                                  partyId : app.party.get('id'),
                                  votes : 1,
                                  played: false,
                                  userId : 0
                              });
      model.save();
      setTimeout(function() {
        idx += 1;
        next_link(links, idx);  
      }, 1000);
    })
  }

  next_link(spotify.links, 0);
});




Mast.routes.index = function(query,page) {
    window.app = new Mast.components.App();
};

});