
var request = require('request'),
    config = global.sails.config;


var upvoteTrack = function(req, track, cb) {

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
module.exports.upvoteTrack = upvoteTrack;


var trackExists = function(trackUri, partyId, cb) {

    Track.find({
        trackUri : trackUri,
        partyId : partyId
    }).done(function(err, track) {
        cb(track);
    });
}
module.exports.trackExists = trackExists;


var createTracks = function(req, tracks, delay, include_duplicates, idx) {

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

            // give it some required values because default values are not supported yet
            t = _.extend(t, {
                userId: 0,
                votes: 0,
                played: false
            });

            // create the track in the db
            Track.create(t).done(function(err, model) {

                // publish it to
                Track.publish(req, null, {
                    uri: Track.identity + '/create',
                    data: model.values,
                });

                // send off to find another track
                setTimeout(function() {
                    createTracks(req, tracks, delay, false, idx);
                }, delay);

            })

        // otherwise vote up if include_duplicates
        } else if (include_duplicates) {

            upvoteTrack(track, function() {
                setTimeout(function() {
                    createTracks(req, tracks, delay, true, idx);
                }, delay);
            });
        }
    })
}
module.exports.createTracks = createTracks;


// we lookup one by one like this so we aren't bombarding servers
//   with multiple requests at the same time.
var doLookups = function(links, cb, idx, res) {

    // defaults
    idx === undefined && (idx = 0);
    res === undefined && (res = []);

    // return results array if we're at the end of the line
    if (idx >= links.length) return cb(res);

    // lookup track with spotify
    request({
        url: 'http://ws.spotify.com/lookup/1/.json?uri=' + links[idx],
        json: true
    }, function(err,response,body) {

        // store the metadata
        res.push(body);

        // recurse
        doLookups(links, cb, idx + 1, res);
    });
}
module.exports.doLookups = doLookups;