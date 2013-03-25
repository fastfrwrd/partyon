define([
    'jquery',
    'underscore',
    'backbone',
    'mast',
    'components/party',
    'components/new',
    'components/loading'
], function($, _, Backbone, Mast) {
    var sp = getSpotifyApi(),
        views = sp.require('$api/views'),
        models = sp.require('$api/models');

    Mast.registerComponent('App', {
      outlet: '#app',
      template: '.panes',
      regions: {
        '.loading-container': 'Loading'
      },
      init: function() {
        _.bindAll(this, 'startParty');
      },
      afterConnect: function() {
        if (this.connected) return;
        this.connected = true;
        this.child('.loading-container').close();
        this.renderRegion('New', '.new-container');
      },
      createParty: function(data) {
        var party = new Mast.models.Party(data);
        party.save(null, {
          success: app.startParty
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
      Mast.Socket.request('/track/createMany', {
        userId: 'w',
        partyId: app.party.get('id'),
        links: spotify.links
      }, $.noop);
    });

    Mast.routes.index = function(query,page) {
      window.app = new Mast.components.App();
    };
});