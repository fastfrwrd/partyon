
var request = require('request'),
    config = global.sails.config;


var trackExists = module.exports.trackExists = function(trackUri, partyId, cb) {

    Track.find({
        trackUri : trackUri,
        partyId : partyId
    }).done(function(err, track) {
        cb(track);
    });
}


var upvoteTrack = module.exports.upvoteTrack = function(req, track, cb) {

    Track.update(track.id, {
        votes: track.votes + 1
    }, function(err, model) {

        Track.publish(req, {
            id: model.id
        }, {
            uri: Track.identity + '/' + model.id + '/update',
            data: model.values
        });

        cb && cb();
    })
}


var createTrack = module.exports.createTrack = function(req, t, cb) {

    // give it some required values because default values are not supported yet
    t = _.defaults(t, {
        userId: 'g',
        votes: 0,
        played: false
    });

    Track.create(t).done(function(err, model) {

        // publish it to rooms
        Track.subscribe(req, model);
        Track.publish(req, null, {
            uri: Track.identity + '/create',
            data: model.values,
        });

        // let 'em know we're done
        cb && cb();
    })
}


var createTracks = module.exports.createTracks = function(req, tracks, delay, include_duplicates, idx) {

    // defaults
    delay === undefined && (delay = 0);
    idx === undefined && (idx = 0);

    // end of the line? exit loop
    if (idx >= tracks.length) return;

    var t = tracks[idx];
    idx += 1;

    Track.find({
        trackUri : t.trackUri,
        partyId : t.partyId
    }).done(function(err, track) {

        // publish a new track
        if (err || !track) {

            // create the track in the db
            createTrack(req, t, function() {
                setTimeout(function() {
                    createTracks(req, tracks, delay, include_duplicates, idx);
                }, delay)
            })

        // otherwise vote up if include_duplicates
        } else if (include_duplicates) {
            upvoteTrack(req, track, function() {
                setTimeout(function() {
                    createTracks(req, tracks, delay, include_duplicates, idx);
                }, delay);
            });

        // or....don't vote up!
        } else {
            setTimeout(function() {
                createTracks(req, tracks, delay, include_duplicates, idx);
            }, delay);
        }
    })
}


// we lookup one by one like this so we aren't bombarding servers
//   with multiple requests at the same time.
var lookupMany = module.exports.lookupMany = function(links, cb, idx, res) {

    // defaults
    idx === undefined && (idx = 0);
    res === undefined && (res = []);

    // return results array if we're at the end of the line
    if (idx >= links.length) return cb(res);

    // lookup track with spotify
    lookup(links[idx], function(err, response, body) {

        // store the metadata
        res.push(body);

        // recurse
        lookupMany(links, cb, idx + 1, res);
    })
};


// Spotify Lookup
// https://developer.spotify.com/technologies/web-api/lookup/
var lookup = module.exports.lookup = function(uri, cb, json) {
    request({
        url: 'http://ws.spotify.com/lookup/1/.json?uri=' + uri,
        json: json === undefined ? true : json
    }, cb);
}


// Spotify Search
// https://developer.spotify.com/technologies/web-api/search/
var search = module.exports.search = function(type, q, cb, json) {
    request({
        url: 'http://ws.spotify.com/search/1/'+type+'.json?q='+q,
        json: json === undefined ? true : json
    }, cb);
}