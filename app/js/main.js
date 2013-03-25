/**
 * Define aliases for common modules so that
 * we don't have to type the entire path in every file.
 */
require.config({
    baseUrl:'js/',
    paths: {
        order: 'libs/require/order',
        loader: 'libs/loader',
        backbone: 'libs/backbone/backbone',
        underscore: 'libs/underscore/underscore',
        jquery: 'libs/jquery/jquery',
        mast: 'libs/mast/mast'
    }
});

require(['components/app','mast'], function(app, M) {
    // CHANGE ME BASED ON ENVIRONMENT
    var url = "http://partyonwayne.local:1337/";
    $.get(url, function() {
        // get the cookie, and now that we have it, raise em up.
        Mast.raise({ baseurl: url });
    });
});