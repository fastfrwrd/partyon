partyon
=======

Party on, Wayne! This is a Spotify App hooked up to a Sails server/web interface that allows you to set up a party that allows participants to request and vote down songs IRL.

setup
-----
### Spotify App
1. make sure you have Spotify Premium
2. hook up your spotify app

		$ > mkdir ~/Spotify
		$ > ln -s path/to/repo/app ~/Spotify/partyon

3. in Spotify, type spotify:app:partyon to make sure it runs

### Node/Sails
1. Get a nodeenv and run it: https://github.com/ekalinin/nodeenv
2. Install sails on your env:

		$(env) > sudo npm -g install sails

3. Run the app and hit it with http://localhost:1337
	
		$(env) > cd path/to/repo/server
		$(env) > sails lift

