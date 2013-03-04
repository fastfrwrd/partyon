var _ = require('underscore');


module.exports = {
	required: function(options) {
		return buildDictionary(options);
	},

	optional: function(options) {
		options.optional = true;
		return buildDictionary(options);
	}
};

/**
buildDictionary ()

Go through each object, include the code, and determine its identity.
Tolerates non-existent files/directories by ignoring them.

options {}
	dirname			:: the path to the source directory
	filter			:: only include modules whose filename matches this regex
	pathFilter		:: only include modules whose full relative path matches this regex (relative from the entry point directory)
	replaceExpr		:: in identity: use this regex to remove things like 'Controller' or 'Service' and replace them with replaceVal
	replaceVal		:: in identity: see above (default value === '')
	optional		:: if optional, don't throw an error if nothing is found
	federated		:: if federated, build the module by grouping submodules by their immediate parent directory name
*/
function buildDictionary(options) {
	
	var files = require('include-all')(options);
	var objects = {};

		_.each(files, function(module, filename) {
			var keyName = filename;

			if (options.identity !== false) {
				// If no 'identity' attribute was provided, 
				// take a guess based on the (case-insensitive) filename
				if(!module.identity) {
					module.identity = options.replaceExpr ? filename.replace(options.replaceExpr, "") : filename;
					
					module.globalId = module.identity;
					module.identity = module.identity.toLowerCase();
					keyName = module.identity;
				}
				else {
					module.globalId = module.identity;
					module.identity = module.identity.toLowerCase();
					keyName = module.identity;
				}
			}
			objects[keyName] = module;
		});		

	if(!objects) return {};
	return objects;
}