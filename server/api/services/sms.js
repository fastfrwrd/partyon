var config = global.sails.config.twilio,
    twilio = _.extend(require('twilio')(config.account_id, config.token), {
        'phone_no' : config.phone_no
    });

var sms = {

    twilio: twilio,

    setHost: function(number) {
        sms.host = number;
    },
    send: function(to, body, cb) {
        if(config.on) {
            twilio.sendSms({
                to: to,
                from: twilio.phone_no,
                body: body
            }, cb);
        }
    },
    notifyHost: function(body, cb) {
        sms.send(sms.host, body, cb);
    }
};

module.exports = sms;