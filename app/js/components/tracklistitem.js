Mast.registerComponent('TrackListItem', {
  template: '.party-track',
  afterRender: function() {
    // append image without making Spotify and Sockets poop themselves
    var imgUrl =  Mast.Socket.baseurl + "user/" + this.$('.user').attr('data-user-id') + "/img.png";
    this.$('.user').append($('<img />', { 'src': imgUrl }));
  }
});