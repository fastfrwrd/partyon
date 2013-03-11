
var config = global.sails.config;

module.exports.findAndCreate = function(trackUri, partyId, cb) {

    Track.find({
        trackUri : trackUri,
        partyId : partyId
    }).done(function(err, track) {
        if (err) cb(err);
        if (track) {

            var request = http.request({
                hostname: config.host,
                port: config.port,
                method: 'PUT',
                path: '/track/'+track.id,
                headers: { 'content-type': 'application/json' }
            });
            var body = { votes : ++track.votes };
            request.write(JSON.stringify(body));
            request.end();

            cb();

        } else cb(false);
    })
}