
var request = require('request'),
    config = global.sails.config;

// refactor to not do url request
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