require(['js/components/app'], function(App) {
    // CHANGE ME BASED ON ENVIRONMENT
    var url = "http://partyonwayne.local:1337/";
    $.get(url, function() {
        // get the cookie, and now that we have it, raise em up.
        Mast.raise({ baseurl: url });
    });
});