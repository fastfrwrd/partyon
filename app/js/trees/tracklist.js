define([
    'jquery',
    'underscore',
    'backbone',
    'mast',
    'components/tracklistitem',
    'collections/tracks'
], function($, _, Backbone, Mast) {
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
        this.collection.sort(); // shouldn't have to call this. re-renders tree.
        // app.playlist.tracks.sort(function(t1, t2) {
        //   t1 = app.tracklist.collection.getOne('trackUri', t1.data.uri);
        //   t2 = app.tracklist.collection.getOne('trackUri', t2.data.uri);
        //   return t2.get('votes') - t1.get('votes');
        // })
        this.render();
      }
    },
    startPlaying : function(track) {
      if(this.collection.size() === 1 && this.collection.first().get('trackUri') !== track.uri) {
        app.player.play(this.collection.first().get('trackUri'), app.playlist);
        app.playlist.addEventListener('change', function(ev) {
          console.log(ev);
          // handle showing a "resume" button
        });
      }
    }
  });
});