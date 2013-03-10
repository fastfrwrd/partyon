var twilio = require('twilio')('XXXXXXXXXX', 'XXXXXXXXXX'),
    from = 'XXXXXXXXXX';

var sms = {

    twilio: twilio,

    send: function(to, body, cb) {
        twilio.sendSms({
            to: to,
            from: from,
            body: body
        }, cb);
    }
}

module.exports = sms;