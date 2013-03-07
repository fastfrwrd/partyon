var app = {

  createParty: function(data) {

    app.new.hide();

    app.party = new Mast.components.Party();
    app.party.set(data);
    app.party.save();

  }

};



Mast.routes.index = function(query,page) {
    app.new = new Mast.components.New();
}

Mast.raise({
    baseurl: 'http://localhost:1337'
});