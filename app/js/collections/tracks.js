define([
    'jquery',
    'underscore',
    'backbone',
    'mast',
    'models/track'
], function($, _, Backbone, Mast) {
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
    getOne: function(attr, val) {
      return this.find(function(track) {
        return track.get(attr) === val;
      });
    },
    onChange: function() {
      app.party.$track_count.text(this.length);
    }
  });
});