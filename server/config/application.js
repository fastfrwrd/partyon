module.exports = {

	// Name of the application (used as default <title>)
	appName: "Party On! By Tucker Bickler and Paul Marbach",
	// The environment the app is deployed in 
	// (`development` or `production`)
	//
	// In `production` mode, all css and js are bundled up and minified
	// And your views and templates are cached in-memory.  Gzip is also used.
	// The downside?  Harder to debug, and the server takes longer to start.
	environment: 'development',
	port: 1337,

	log: {
		level: 'verbose'
	},
	// inclue your own in server/config/local.js
	echonest : {
		api_key : "",
		consumer_key : "",
		shared_secret : ""
	},
	twilio : {
        account_id : "",
        token : "",
        phone_no : "",
        on : true
    }
};