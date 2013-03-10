var twilio = require('twilio')('XXXXXXXXXX', 'XXXXXXXXXX'),
    _ = require('underscore'),
    from = 'XXXXXXXXXX';

module.exports = {
    twilio: twilio,

    sendSms: function(to, body, cb) {
        twilio.sendSms({
            to: to,
            from: from,
            body: body
        }, function() {
            console.log(arguments);
        });
    },


}