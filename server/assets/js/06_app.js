jQuery(function($) {

    window.app || (window.app = {});

    Mast.registerComponent('Loading', {
      template: '.loading'
    });

    Mast.registerComponent('TrackListItem', {
        template : '.party-track'
    });

    Mast.registerModel('Track', {
        url : function() {
            return '/track'
        },
        defaults: {
            title: "",
            userId: 0,
            trackUri: "",
            artists: "",
            votes: 0,
            partyId: app.party_id,
            played: false,
            users : function() {
                return this.get('userId').split(',');
            }
        }
    });

    Mast.registerCollection('Tracks', {
        url : '/track',
        model : 'Track',
        autoFetch: false,
        comparator: function(track) {
            return -track.get('votes');
        },
        events : {
            'click .vote' : 'vote'
        },
        init: function() {
            this.listenTo(this, 'reset', this.onChange);
            this.listenTo(this, 'add', this.onChange);
            this.listenTo(this, 'remove', this.onChange);
        },
        vote : function(ev) {
            ev.preventDefault();
            // voting magic
        },
        onChange: function() {
            app.party.$track_count.text(this.length);
        }
    });

    Mast.registerTree("TrackList", {
        outlet : '.queue',
        template : '.queue',
        collection : "Tracks",
        branchComponent : "TrackListItem",
        emptyHTML: "<li>No tracks yet for this party.</li>",
        loadingHTML: "<li>Loading...</li>",
        errorHTML: "<li>There was an error retrieving tracks. Bummer, dude.</li>",
        init: function() {
            this.fetchCollection({ 
                partyId : app.party_id,
                played : false 
            });
        },
        subscriptions: {
            '~track/create': function (track) {
                if (track.partyId != app.party_id) return;
                this.collection.add(track);
            },
            '~track/:id/update': function (id, attributes) {
                var track = this.collection.get(id);
                if (track.get('partyId') != app.party_id) return;

                track.set(attributes);
                this.collection.sort();
                this.render();
            }
        }
    });

    Mast.registerModel('Party', {
        urlRoot: '/party'
    });

    Mast.registerComponent('Party', {
        template: '.party',
        model: 'Party',
        regions: {
            '.queue': 'TrackList'
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

            Mast.TemplateLibrary['.search-result'] = $('.search-result').outerHTML().replace('%7B%7B', '{{').replace('%7D%7D', '}}');;

            // autocomplete setup
            this.$('.sp-search')
                .autocomplete({
                    source: function(req, res) {
                        $.getJSON("/track/suggest?q=" + req.term, function(data) {
                            res(_.map(_.first(data.tracks, 5), function(track) { return track; }));
                        });
                    },
                    select: function(ev, ui) {
                        var model = new Mast.models.Track({
                            trackUri : ui.item.href,
                            title : ui.item.name,
                            artist : _.pluck(ui.item.artists, 'name').join(', '),
                            partyId : app.party_id,
                            votes : 1,
                            played: false,
                            userId : app.user_id
                        });
                        model.url = function() { return "/track" };
                        model.save();
                    }
                }).data( "ui-autocomplete" )._renderItem = function( ul, item ) {
                    return $('<li />')
                        .append(_.template(Mast.TemplateLibrary['.search-result'], item))
                        .appendTo(ul);
                };
        }
    });

    Mast.registerComponent('App', {
        outlet: '.container',
        template: '.panes',
        regions: {
            '.loading-container': 'Loading'
        },
        init: function() {
            _.bindAll(this, 'startParty')
        },
        afterConnect: function() {
            Mast.Socket.find(new Mast.models.Party(), {
                data: { id: app.party_id },
                success: this.startParty
            });
        },
        startParty: function(attrs) {
            app.child('.loading-container').close();
            this.renderRegion('Party', '.party-container', attrs);
            app.party = app.child('.party-container');
        }
    })

    Mast.routes.index = function(query,page) {
        _.extend(window.app, new Mast.components.App());
    }

    Mast.raise({
        baseurl : "http://partyonwayne.local:1337"
    });
});