require([
    '$api/models',
    'js/components/party',
    'js/components/new',
    'js/components/loading'
], function(models, Party, New, Loading) {
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
        models.Playlist.createTemporary("partyon-current").done(function(p) {
          app.playlist = p;
          app.playlist.addEventListener('change', function(ev) {
            console.log(ev);
          });
        });
      }
    });

    /*models.application.observe(models.EVENT.LINKSCHANGED, function(spotify) {
      Mast.Socket.request('/track/createMany', {
        userId: 'w',
        partyId: app.party.get('id'),
        links: spotify.links
      }, $.noop);
    });*/

    Mast.routes.index = function(query,page) {
      window.app = new Mast.components.App();
    };
});