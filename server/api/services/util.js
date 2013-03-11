
var request = require('request'),
    config = global.sails.config;

module.exports.findAndUpdate = function(trackUri, partyId, cb) {

    Track.find({
        trackUri : trackUri,
        partyId : partyId
    }).done(function(err, track) {

        if (err) cb(err);
        if (track) {

            request.post({
                url: 'http://' + config.host + ':' + config.port + '/track/update/' + track.id + '?votes=' + (track.votes+1),
                json: true
            }, function() {
                cb();
            });

        } else cb(true);
    })
}

module.exports.create = function(track, cb) {
    console.log('create');
    request.post({
        url: 'http://' + config.host + ':' + config.port + '/track/create',
        json: true,
        body: JSON.stringify(track)
    }, function(err, response, body) {
        console.log(err, response, body);
        cb(err, response, body);
    });
}