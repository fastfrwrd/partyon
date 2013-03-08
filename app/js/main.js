var app = {

  createParty: function(data) {

    app.new.hide();

    var party = new Mast.models.Party(data);
    party.save({}, {
        success: function(model) {
            app.party = new Mast.components.Party({
                model: model
            });
        }
    })
  }

};



Mast.routes.index = function(query,page) {
    app.new = new Mast.components.New();
}

Mast.raise({
    baseurl: 'http://localhost:1337'
});