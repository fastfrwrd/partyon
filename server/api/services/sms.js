var config = global.sails.config.twilio,
    twilio = require('twilio')(config.account_id, config.token),
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