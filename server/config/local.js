// Local configuration
// 
// Included in the .gitignore by default,
// this is where you include configuration overrides for your local system
// or for a production deployment.


// For example, to use port 80 on the local machine, override the `port` config
// module.exports.port = 80;

// or to keep your db credentials out of the repo, but to use them on the local machine
// override the `modelDefaults` config
// module.exports.modelDefaults = { database: 'foo', user: 'bar', password: 'baZ'}

module.exports = {
	host : "partyonwayne.local",
	port : 1337,

	echonest : {
		api_key       : 'XXXXXXXXXX',
		consumer_key  : 'XXXXXXXXXX',
		shared_secret : 'XXXXXXXXXX'
	},
    twilio : {
        account_id : 'XXXXXXXXXX',
        token      : 'XXXXXXXXXX',
        phone_no   : 'XXXXXXXXXX',
        on         : false
    }
};