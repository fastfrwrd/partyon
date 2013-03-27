require([
    '$api/models',
    'js/components/tracklistitem',
    'js/collections/tracks'
], function(models, Tracklistitem, Tracks) {
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
        var self = this;
        self.collection.add(track);
        app.playlist.load('tracks').done(function(playlist) {
          playlist.tracks.add(models.Track.fromURI(track.trackUri)).done(function() {
            if(self.collection.size() === 1) self.startPlaying(track);
          });
        });
      },
      '~track/:id/update': function (id, attributes) {
        var track = this.collection.get(id);
        track.set(attributes);
        this.collection.sort(); // shouldn't have to call this. re-renders tree.

        app.playlist.load('tracks').done(function(playlist) {
          // start with the subset of the tracks that skips everything played up until and including now
          // sort this part of the playlist
          /* playlist.tracks.sort(function(t1, t2) {
            t1 = app.tracklist.collection.getOne('trackUri', t1.data.uri);
            t2 = app.tracklist.collection.getOne('trackUri', t2.data.uri);
            return t2.get('votes') - t1.get('votes');
          }); */
        });

        this.render();
      }
    },
    startPlaying : function(track) {
      console.log('play', track);
      models.player.playContext(app.playlist);
    }
  });
});