var config = global.sails.config.twilio,
    twilio = require('twilio')(config.account_id, config.token),
    from = 'XXXXXXXXXX';

var sms = {

    twilio: twilio,

    setHost: function(number) {
        sms.host = number;
    },
    send: function(to, body, cb) {
        twilio.sendSms({
            to: to,
            from: from,
            body: body
        }, cb);
    },
    notifyHost: function(body, cb) {
        sms.send(sms.host, body, cb);
    }
}

module.exports = sms;