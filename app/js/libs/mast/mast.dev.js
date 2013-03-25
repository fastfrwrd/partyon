// Build mast objects and set defaults
// Mast is also a global event dispatcher (before router is instantiated!)
Mast = _.extend(Backbone, {

  // Whether to remove ids from template elements automatically before absorption
  removeTemplateIds: true,

  // Route map that will be populated by user definitions
  routes: {},

  // Model/collection dictionary that will be populated by user definitions
  models: {},

  // Component dictionary that will be populated by user definitions
  components: {},

  // Detect mobile viewports (looks at the user agent string)
  isMobile: navigator.userAgent.match(/(iPhone|iPod|Android|BlackBerry)/ig),

  isTouch: navigator.userAgent.match(/(iPad|iPhone|iPod|Android|BlackBerry)/ig),

  // Mast.raise() instantiates the Mast library with the specified options
  raise: function(options, afterLoadFn, beforeRouteFn) {

    // If function is specified as first argument, use it as 
    if(_.isFunction(options)) {
      afterLoadFn = options;
      options = {
        afterLoadFn: options
      };
    }

    // Set up template settings
    _.templateSettings = (options && options.templateSettings) || {
      //      variable: 'data',
      interpolate: /\{\{(.+?)\}\}/g,
      escape: /\{\{-(.+?)\}\}/g,
      evaluate: /\{\%(.+?)\%\}/g
    };

    $(function() {
      options = _.defaults(options || {}, { // Extend defaults
        socket: true,
        afterLoadFn: afterLoadFn,
        beforeRouteFn: beforeRouteFn
      });

      // Absorb key Mast property overrides from options
      if(options.removeTemplateIds !== undefined) {
        Mast.removeTemplateIds = options.removeTemplateIds;
      }

      // Register Mast.entities and enable inheritance
      Mast.mixins.registerEntities();


      // Prepare template library
      // HTML templates can be manually assigned here
      // otherwise they can be loaded from DOM elements
      // or from a URL
      Mast.TemplateLibrary = {};

      // Initialize Socket
      // Override default base URL if one was specified
      if(Mast.Socket && options.socket) {
        Mast.Socket.baseurl = (options && options.baseurl) || Mast.Socket.baseurl;
        Mast.Socket.initialize();
      }

      // Before routing, trigger beforeRouteFn callback (if specified)
      options.beforeRouteFn && options.beforeRouteFn();

      // Clone router
      Mast.Router = Backbone.Router.extend({});

      // Instantiate router and trigger routerInitialized event on components
      var router = new Mast.Router();

      // "Warm up" the router so that it will create Backbone.history
      router.route("somecrazyneverusedthing", "somenameofsomecrazyneverusedthing", function() {
        throw new Error("Can't listen on a route using reserved word: somenameofsomecrazyneverusedthing!");
      });

      // Add wildcard route
      Backbone.history.route(/.*/, function(fragment) {

        // Trigger specific route event
        Mast.trigger("route:#" + fragment);

        // Trigger cross-browser global hashchange event
        Mast.trigger("event:$hashchange");
      });

      // LEGACY: Decorate and interpret defined routes
      // (Routes are now handled as subscriptions in components)
      _.each(Mast.routes, function(action, query) {
        // "routes" is a reserved word
        if(query == "routes") throw new Error("Can't define a route using reserved word: '" + query + "'!");

        // Index and "" are the same thing
        if(query === "index" || query === "") {
          router.route("", "index", action);
        }

        // Set up route
        router.route(query, query, action);
      });

      // Mast makes the assumption that you want to trigger
      // the route handler.  This can be overridden
      Mast.navigate = function(query, options) {
        return router.navigate(query, _.extend({
          trigger: true
        }, options));
      };


      // TODO: Go ahead and absorb all of the templates in the library 
      // right from the get-go
      // TODO: parse rest of DOM to find and absorb implicit templates
      
      // Launch history manager 
      Mast.history.start();

      // When Mast and $.document are ready, 
      // trigger afterLoad callback (if specified)
      options.afterLoadFn && _.defer(options.afterLoadFn);
      options.afterRouteFn && _.defer(options.afterRouteFn);
    });
  }
}, Backbone.Events);


Mast.mixins = {

  /**
  * Translator for Mast shorthand notation
  * command - the string command to interpret
  * "this" refers to the calling instance
  *
  * Returns a working function or throws an error
  */
  interpretShorthand: function (command) {
    // If command is a function, nothing needs to be done
    if (_.isFunction(command)) {
      return command;
    }
    else if (_.isString(command)) {
      var matches = null;
      var attribute;
      var value;
      var ev;
      var method;
      var route;

      // If expression ends with a ., do stopPropagation
      // (i.e. '%someEvent.'  or  '@someAttr="someVal".')
      var stopPropagation = command.match(/^(.+)\.$/);

      // Toggle attribute (i.e. @enabled!)
      if (matches = command.match(/^@([$_a-zA-Z]+)\s*!\.?$/)) {
        attribute = _.str.rtrim(matches[1]);
        method = function (e) {
          this.set(attribute,!this.get(attribute));
          stopPropagation && e.stopPropagation();
        };
      }
      // Set attribute (i.e. '@name = "Mike"')
      else if (matches = command.match(/^@([$_a-zA-Z]+)\s*=\s*["']?([^'"]+)["']?\.?$/)) {
        attribute = matches[1], value = _.str.rtrim(matches[2]);
        method = function (e) {
          // If value can be parsed as a number, do so
          value = _.isFinite(+value) ? +value : value;
          // Set attribute to value
          this.set(attribute,value);
          stopPropagation && e.stopPropagation();
        };
      }
      // Trigger global event (i.e. '%someEvent')
      else if (matches = command.match(/^%([^'"]+)\.?$/)) {
        ev = _.str.rtrim(matches[1],".");
        method = function (e) {
          Mast.trigger(ev);
          stopPropagation && e.stopPropagation();
        };
      }
      // Navigate to a client-side hash url (i.e. '%some/route')
      else if (matches = command.match(/^#([^'"]+)\.?$/)) {
        route = _.str.rtrim(matches[1],".");
        method = function (e) {
          Mast.navigate(route);
          stopPropagation && e.stopPropagation();
        };
      }
      // If ., do a simple stopPropagation (i.e. '.')
      else if (matches = command.match(/^\.$/)) {
        method = function (e) {
          e.stopPropagation();
        };
      }
      // If this is just a simple string (i.e. 'someMethod')
      else if (matches = command.match(/^([^'"]+)\.?$/)) {
        method = function (e) {
          var fnName = matches[1];
          if (stopPropagation) {
            e.stopPropagation();
            fnName = fnName.substr(0,fnName.length-1);
          }
          // Run fn
          this[fnName].apply(this,arguments);
        };
      }

      // backbone will do the work of binding functions afterwards
      return method || command;
    }
  },

  // Register models, collections, components, and trees and manage dependencies/inheritance
  registerEntities: function() {

    var infinityCounter = 0;
    while(Mast._registerQueue.length > 0) {
      _.each(Mast._registerQueue, function(v, i) {
        v.definition = v.definition || {}; // Support undefined definition
        var entitySet = // Determine entity set (i.e. Mast.components, Mast.models)
        (v.type == 'tree' || v.type == 'component') ? Mast.components : Mast.models;
        var parent = (v.definition.extendsFrom) ? // Determine parent
        entitySet[v.definition.extendsFrom] : Mast[_.str.capitalize(v.type)];
        if(parent) {
          var newEntity = parent.extend(v.definition); // Extend parent
          newEntity.prototype.events = // Extend events hash 
          _.extend({}, parent.prototype.events, newEntity.prototype.events);
          newEntity.prototype.bindings = // Extend bindings hash 
          _.extend({}, parent.prototype.bindings, newEntity.prototype.bindings);
          newEntity.prototype.subscriptions = // Extend subscriptions hash 
          _.extend({}, parent.prototype.subscriptions, newEntity.prototype.subscriptions);
          entitySet[v.name] = newEntity; // Register new instance in entity set

          // Map shorthand
          newEntity.prototype.events = _.objMap(newEntity.prototype.events,Mast.mixins.interpretShorthand);
          // newEntity.prototype.bindings = _.objMap(newEntity.prototype.bindings,Mast.mixins.interpretShorthand);
          newEntity.prototype.subscriptions = _.objMap(newEntity.prototype.subscriptions,Mast.mixins.interpretShorthand);

          Mast._registerQueue.splice(i, 1);
        } else {
          infinityCounter++;
          if(infinityCounter > 1000) {
            debug.warn('Parent does not seem to be registered', v.definition.extendsFrom, "in:", entitySet);
            throw new Error("Could find parent, " + v.definition.extendsFrom + "!");
          }
        }
      });
    }
  },
  
  // Given a class, string, or definition object, return a new instance of the indicated class
  // Given an instance, return it (reflexive)
  provisionInstance: function (identity, identitySet, identityPrototype) {
    
    if (identity && _.isObject(identity) && _.isFunction(identity)) {   // Mast class
      return new identity();
    }
    else if (_.isString(identity)) {                    // A string class name      
      if (!identitySet[identity]) {
        throw new Error("No identity with that name ("+identity+") exists!");
      }
      identitySet[identity].prototype._class=identity;
      return new identitySet[identity]();
    }
    else if (_.isObject(identity)) {
      // If this looks like an instance, use it directly
      if (identity.cid || identity._byCid) {
        return identity;
      }
      // If identityPrototype is a Collection, and this is an array, 
      // this is data for instantiating an anonymous collection
      else if (_.isArray(identity) && identityPrototype === Mast.Collection) {
        return new Mast.Collection(identity);
      }
      // If this is a model, use entity as the argument to the constructor to the anonymous model
      else if (identityPrototype === Mast.Model) {
        return new Mast.Model(identity);
      }
      // Otherwise we will assume this is meant as an entity prototype, and extend it before instantiating
      else {
        return new (identityPrototype.extend(identity))();
      }
    }
    else {
      debug.error("Invalid identity definition: ",identity);        // Something is amiss, throw an error
      throw new Error("Invalid identity definition.");
    }
  },
  
  // Given a string or class definition, return a class
  // Given a class, return it (reflexive)
  provisionPrototype: function (identity, identitySet, identityPrototype) {
    if (identity && _.isObject(identity) && _.isFunction(identity)) {   // A Mast class
      return identity;
    }
    else if (_.isString(identity)) {                    // A string class name
      if (!(identitySet[identity])) {
        throw new Error("No identity with that name ("+identity+") exists!");
      }
      identitySet[identity].prototype._class=identity;
      return identitySet[identity];
    }
    else if (_.isObject(identity)) {
      if (identity.cid || identity._byCid) {
        throw new Error("A class, string class name, or class definition should be specified, not an instance!");
      }
      var parentPrototype = (identity.extendsFrom && Mast.mixins.provisionPrototype(identity.extendsFrom,identitySet,identityPrototype)) || identityPrototype;
      if (! parentPrototype.extend) {
        throw new Error ("Invalid identity provided: " + identity);
      }
      return parentPrototype.extend(identity);              // An object: treat this as a class definition and try to define a new class
    }
    else {                                  // Something is amiss, throw an error
      throw new Error ("Invalid identity provided: " + identity);
    }
  },

  /**
  * Determine the proper outlet selector and ensure that it is valid
  * outlet - selector or jQuery $el to use as outlet
  * context - if a selector was specified, the context for DOM selection
  */
  verifyOutlet: function (outlet,context) {
    // If no outlet is set on this component, throw an error
    if (!outlet) {
      throw new Error("No outlet selector specified to render into!");
    }
    
    var $outlet;
    if (_.isString(outlet)) {
      // Select the outlet element
      if (context) {
        $outlet = (context && context.closest_descendant(outlet));
      }
      else {
        $outlet = $(outlet);
      }
    }
    else {
      $outlet = outlet;
    }
    
    // If no outlet could be selected, or more than one exists, throw a warning
    if ($outlet.length != 1) {
      debug.warn(
        (($outlet.length > 1)?"More than one ":"No ")+
        (($outlet.length > 1)?"element exists ":"elements exist ")+
        (context?"in this template context ("+context+ ")":"") +
        "for the specified "+
        (context?"child ":"") +
        "outlet selector! ('"+outlet+"')");
      return false;
    }
    return $outlet;
  },

  // Use Backbone's Router logic to parse parameters (/variable/parsing/:within/:path)
  // and match against an existing collection of patterns
  matchRoutePattern: function (key,pattern) {
    var extractParams = Backbone.Router.prototype._extractParameters,
      calculateRegex = Backbone.Router.prototype._routeToRegExp;

    // Trim traliing and leading slashes
    pattern = _.str.trim(pattern,'/');
    var regex=calculateRegex(pattern);

    // If there is no match, return false
    if (!key.match(regex)) {
      return false;
    }
    // Return a list of the extracted parameters, or an empty list if none were sent
    else {
      return extractParams(regex,key);
    }
  },
  
  // Given a jQuery object, return the html, **INCLUDING** the element itself
  outerHTML: function(s) {
    return s ? 
      this.before(s).remove() : 
      jQuery("<p>").append(this.eq(0).clone()).html();
  },
  
  // Get first descendant that matches the specified selector
  closestDescendant: function(filter) {
    var $found = $(),
    $currentSet = this;                             // Current place
    while ($currentSet.length) {
      $found = $currentSet.filter(filter);
      if ($found.length) break;                       // At least one match: break loop
      $currentSet = $currentSet.children();                 // Get all children of the current set
    }
    return $found.first();                            // Return first match of the collection
  } 
};


// Mix in jQuery plugins
_.extend(jQuery.fn,{
  outerHTML: Mast.mixins.outerHTML,
  closest_descendant: Mast.mixins.closestDescendant
});


// Underscore mixins
_.mixin({
  // ### _.objMap
  // _.map for objects, keeps key/value associations
  objMap: function (input, mapper, context) {
    return _.reduce(input, function (obj, v, k) {
             obj[k] = mapper.call(context, v, k, input);
             return obj;
           }, {}, context);
  },
  // ### _.objFilter
  // _.filter for objects, keeps key/value associations
  // but only includes the properties that pass test().
  objFilter: function (input, test, context) {
    return _.reduce(input, function (obj, v, k) {
             if (test.call(context, v, k, input)) {
               obj[k] = v;
             }
             return obj;
           }, {}, context);
  },
  // ### _.objReject
  //
  // _.reject for objects, keeps key/value associations
  // but does not include the properties that pass test().
  objReject: function (input, test, context) {
    return _.reduce(input, function (obj, v, k) {
             if (!test.call(context, v, k, input)) {
               obj[k] = v;
             }
             return obj;
           }, {}, context);
  }
});


Mast.Model = Mast.Model.extend({
  initialize: function() {
    _.bindAll(this);
    
    // Trigger init event
    _.result(this,'init');
  },
  
  increment: function(key,amount,options) {
    var self = this;
    Mast.Component.prototype._normalizeArgs(key, amount, options, function(attrs,options) {
      attrs = _.objMap(attrs,function(amt,key) {
        return self.get(key)+amt;
      });
      self.set(attrs,options);
    });
  },
  
  decrement: function(key,amount,options) {
    var self = this;
    Mast.Component.prototype._normalizeArgs(key, amount, options, function(attrs,options) {
      attrs = _.objMap(attrs,function(amt,key) {
        return self.get(key)-amt;
      });
      self.set(attrs,options);
    });
  }
});

Mast.Collection = Mast.Collection.extend({

  initialize: function() {
    _.bindAll(this);
    
    // Allow model to be specified as a string, class def, etc.
    this.model = this.model && Mast.mixins.provisionPrototype(this.model,Mast.models,Mast.Model);
    
    // Determine autoFetch default state if not specified
    if (_.isUndefined(this.autoFetch)) {
      this.autoFetch = !! this.url;
    }

    // Absorb defaults, if provided
    if (this.defaults) {
      this.reset(this.defaults);
    }
    
    // Do autoFetch
    this.autoFetch && this.fetch();
    
    // Trigger init event
    _.result(this,'init');
  }
});


// Mast.Socket wraps around socket.io to provide a universal API  
// for programatic communication with the Sails backend
Mast.Socket =_.extend(
{ 
  
  // The base url of the application
  baseurl: window.location.origin,
  
  // Whether to connect automatically
  autoconnect: true,
  
  // Map of entities and actions, by uri
  routes: {},
  
  // Override backbone.sync when Socket object is instantiated
  initialize: function(cb) {
    _.bindAll(this);

    this.autoconnect && this.connect(cb);

    // Override Backbone.sync for Socket
    // (reference: http://documentcloud.github.com/backbone/docs/backbone-localstorage.html)
    Backbone.sync = function(method, model, options) {
      switch (method) {
        case "read":
          model.id ? 
            Mast.Socket.find(model,options) : 
            Mast.Socket.findAll(model,options);
          break;
        case "create":
          Mast.Socket.create(model,options);
          break;
        case "update":
          Mast.Socket.update(model,options);
          break;
        case "delete":
          Mast.Socket.destroy(model,options);
          break;
      }
    };
  },
  
  // Connect to socket
  connect: function(baseurl,cb) {
    var self = this;

    // Local reference to Socket.io object
    this.io = this.io || window.io;
    if (!this.io) {
      throw new Error(
      "Can't connect to socket because the Socket.io client library (io) cannot be found!"
      );
    }
    if (this.connected) {
      throw new Error(
        "Can't connect to "+baseurl+ " because you're "+
        "already connected to a socket @ " + this.baseurl+"!"
        );
    }
    this.baseurl = baseurl || this.baseurl;
    
    debug.debug("Connecting socket to "+this.baseurl);
    this._socket = this.io.connect(this.baseurl);

    // Listen for latest session data from server and update local store
    Mast.Socket._socket.on('sessionUpdated',function(data) {
      Mast.Session = data;
      Mast.Socket.trigger('sessionUpdated');
    });

    // Route server-sent comet events
    Mast.Socket._socket.on('message',function(cometMessage) {
      if (cometMessage.uri) {
        Mast.Socket.route(cometMessage.uri,_.clone(cometMessage.data));
      }
      else {
        debug.warn('Unknown message received from server.',cometMessage);
        throw new Error('Unknown message received from server.');
      }
    });
    this.connected = true;
  },
  
  // Route an incoming comet request to the appropriate context and action
  // TODO: use mixin here
  route: function (serverUri,serverData) {
    // Use Backbone's Router logic to parse parameters (/variable/parsing/:within/:path)
    var extractParams = Backbone.Router.prototype._extractParameters,
      calculateRegex = Backbone.Router.prototype._routeToRegExp;

    // Match the request's URI against each subcribed route
    _.each(Mast.Socket.routes,function(instances,routeUri) {
      // Peel off comet symbol (~)
      routeUri = _.str.ltrim(routeUri,'~');
      
      // Trim traliing and leading slashes
      routeUri = _.str.trim(routeUri,'/');
      var regex=calculateRegex(routeUri);
      if (serverUri.match(regex)) {

        // Grab named uri parameters and include them as arguments
        var params=extractParams(regex,serverUri);
        _.each(instances,function(instance,index) {
          params.push(serverData);

          // Run the appropriate action on each matching, subscribed instance
          instance.action.apply(instance.context,params);
        });
      }
    });
  },
  
  // Subscribe a client-side handler action to a server-sent event
  subscribe: function (routeUri,action,context) {
    if (!Mast.Socket.routes[routeUri]) {
      Mast.Socket.routes[routeUri] = [];
    }
    Mast.Socket.routes[routeUri].push({
      // The function to trigger
      action: action,

      // Component where the logic will run
      context: context
    });
  },
      
  // CRUD methods for Backbone usage
  create: function(model,options){
    var url = (model.url() || model.collection.url) + "/create";

    var data = model.toJSON();

    // Always pass a filter attribute in case this user is using the Sails API scaffold
    _.extend(data, {
      sails_filter: true
    });

    this.post(url,model.toJSON(),function (parsedResult) {
      options && options.success && options.success(parsedResult);
    });
  },
  
  find: function(model,options, huh){
    options = options || {};
    options.data = options.data || {};

    // Remove trailing slash and add /find to url
    url = model.url().replace(/\/*$/,'');
    var id = +(url.match(/(\/[^\/]+)$/)[0].replace(/[^0-9]/,''));

    // include an id attribute unless one is already set
    options.data = _.extend({
      id:id
    },options.data);

    // Always pass a filter attribute in case this user is using the Sails API scaffold
    _.extend(options.data, {
      sails_filter: true
    });

    // Add id to params
    this.get(url, options.data, function (parsedResult) { 
      console.log("FIND RESULT:",parsedResult);

      options && options.success && options.success(parsedResult);
    });
  },
  
  findAll: function(collection,options){
    options = options || {};
    options.data = options.data || {};

    var url = (collection.url);
    
    // Support limit/offset/search/sort params in main .fetch({}) instead of just in {data:{}}
    _.defaults(options.data,{
      where: options.where,
      search: options.search,
      limit: options.limit,
      skip: options.skip,
      order: options.order
    });

    // Always pass a filter attribute in case this user is using the Sails API scaffold
    _.extend(options.data, {
      sails_filter: true
    });

    this.get(url, options.data, function (parsedResult) {
      options && options.success && options.success(parsedResult);
    });
  },
  
  update: function(model,options){
    // Remove trailing slash and add /update to url
    var url = model.url().replace(/\/*$/,'');
    var id = +(url.match(/(\/[^\/]+)$/)[0].replace(/[^0-9]/,''));

    // Add id to data params
    var data = _.extend({id:id},model.toJSON());

    // Always pass a filter attribute in case this user is using the Sails API scaffold
    _.extend(data, {
      sails_filter: true
    });

    this.put(url, data, function (parsedResult) {
      options && options.success && options.success(parsedResult);
    });
  },
  
  destroy: function(model,options){
    // Remove trailing slash and add /destroy to url
    var url = model.url().replace(/\/*$/,'');
    var id = +(url.match(/(\/[^\/]+)$/)[0].replace(/[^0-9]/,''));

    // Add id to data params
    this['delete'](url,{id:id},function (parsedResult) {
      options && options.success && options.success(parsedResult);
    });
  },
  
  // Request wrappers for each of the CRUD HTTP verbs
  get: function (url,data,options) { this.request(url,data,options,'get'); },
  post: function (url,data,options) { this.request(url,data,options,'post'); },
  put: function (url,data,options) { this.request(url,data,options,'put'); },
  'delete': function (url,data,options) { this.request(url,data,options,'delete'); },
  
  // Simulate an HTTP request to the backend
  request: function (url,data,options, method) {
    // Remove trailing slashes and spaces
    url = url.replace(/\/*\s*$/,'');

    // If url is empty, use /
    if (url === '') url = '/';

    // If options is a function, treat it as a callback
    // Otherwise the "success" property will be treated as the callback
    var cb;
    if (_.isFunction(options)) cb = options;
    else cb = options.success;

    // If not connected, fall back to $.ajax
    if (!this.connected) {
      return $.ajax(url,_.extend(options,{
        data: data,
        type: method || 'get'
      }));
    }

    console.log('url',url);
    console.log('data',data);
    console.log('method',method);

    this._send('message',{
      url: url,
      data: data,
      method: method || 'get'
    },function (parsedResult) {

      // TODO
      // Handle errors
      if (parsedResult === 404) throw new Error("404: Not found");
      if (parsedResult === 403) throw new Error("403: Forbidden");
      if (parsedResult === 500) throw new Error("500: Server error");

      cb(parsedResult);
    });
  },
  
  /**
   * Make a call to the server over the socket
   *   label:   the request label
   *   params:  data to pass with the request
   *   callback:  optional callback fired when server responds
   */
  _send: function (label,params,callback) {
    Mast.Socket._socket.emit(label,JSON.stringify(params),function(result) {
      var parsedResult;
      try {
        parsedResult = JSON.parse(result);
      }
      catch (e) {
        debug.debug("Could not parse:",result,e);
        throw new Error("Server response could not be parsed!");
      }

      // Call success callback if specified
      callback && callback(parsedResult);
    });
  }
},Backbone.Events);


// Patterns are the smallest unit that has state and a template
// They are always owned by a Component, and their only logic should be the 
// deterministic generation of HTML given a particular model and template
Mast.Pattern = {
    
  // Absorb and delete template
  initialize: function(attributes,options){
    // Bind context
    _.bindAll(this);
    var self=this;
      
    _.extend(this,attributes);
      
    // If a template was specified, absorb it
    if (this.template) {
      this.absorbTemplate(this.template);
    }
      
    // Determine whether specified model is a className, class, or instance
    this.model = Mast.mixins.provisionInstance(this.model,Mast.models,Mast.Model);
    
    // Listen for changes in model and bubble them up
    this.model && this.model.on('change',function(model,options){
      self.trigger('change',options?!options.render:null,model.changedAttributes());
    });
    
    // Initialize init method if specified
    _.result(this,'init');
  },
    
  // Absorb or access cached template
  absorbTemplate: function(selector) {
    
    // If template is already cached in template library
    if (typeof Mast.TemplateLibrary[selector] != 'undefined') {
      // Grab cached copy of html from template library
      this._template = Mast.TemplateLibrary[selector];
    }
    // Otherwise the template will need to be fetched from the DOM
    else {
      // Try to select the template from the DOM
      var $template = $(selector);
      if ($template.length < 1) {
        throw new Error("No elements exist for the specified template selector! ('"+selector+"')");
      }
      
      // If an id exists for this template element
      if (!! $template.attr('id')) {
        // Depending on state of Mast.removeTemplateIds, issue a warning message
        var warningMessage = "An #id ("+$template.attr('id')+") was specified in a template element."+
          " (Ids shouldn't be set on template elements, since more than one copy might be created.) ";
        if (Mast.removeTemplateIds) {
          // Remove id attr!
          warningMessage += " Removing #id ("+$template.attr('id')+") from template... (NOTE: this may break your CSS.)";
          $template.removeAttr("id");
        }
        debug.warn(warningMessage);
      }     

      // Absorb template (remove from DOM and cache in template library)
      this._template = $template.outerHTML();
      this._template = this._template.replace('%7B%7B', '{{').replace('%7D%7D', '}}');
      $template.remove();
      Mast.TemplateLibrary[selector] = this._template;
    }
  },
    
  // Return templated HTML for this pattern
  generate: function (data) {
    data = this._normalizeData(data);
    // console.log("* Pattern rendering:",this._template,data);
    return ((_.template(this._template))(data));
  },
    
    
  // Replace this pattern's template and create one with the specified 
  // template selector.
  setTemplate: function (template,options) {
    options = _.defaults(options || {}, {
      render: true
    });
    this.absorbTemplate(template);
    
    if (!(options && options.silent)) {
      
      // The change event must be manually triggered since there isn't necessarily a model
      this.trigger('change');
    } 
  },
      
  // Pass-through methods to model
  set: function(key,value,options) {
    
    // If no model exists, create one
    var m;
    if (!this.model) {
      m = new Mast.Model();
    }
    else {
      m = this.model;
    }
    
    m.set(key,value,options);
  },
  get: function(key) {
    return this.model && this.model.get(key);
  },
      
  _normalizeData: function (data) {
    var modelData = this.model && this.model.toJSON && this.model.toJSON();
    return data ? _.extend(_.clone(modelData), data) : modelData || {};
  }
}


// Bind global events to the Mast dispatcher
$(function() {

  // $hashchange is defined in mast.js with the routing stuff
  // $mousemove
  $(window).bind('mousemove', globalDispatchBinding('$mousemove'));

  // $click
  $(window).bind('click', globalDispatchBinding('$click'));

  // $pressEnter
  $(document).bind('gPressEnter', globalDispatchBinding('$pressEnter'));

  // $pressEsc
  $(document).bind('gPressEsc', globalDispatchBinding('$pressEsc'));



  // Generate a function which fires the event trigger on the Mast global dispatcher
  // and passes down arguments from the event handler


  function globalDispatchBinding(event) {
    return function() {
      Mast.trigger.apply(Mast, ['event:' + event].concat(_.toArray(arguments)));
    };
  }



  //  function handle(e) {
  //    e.stopPropagation();
  //    var pressedkeycode = e.keyCode || e.which;
  //    if(pressedkeycode === keyCode) {
  //      // e.preventDefault();
  //      origTarget.triggerHandler( handlerName,e );
  //    }
  //  }

  // // Create touch event
  // // var globalScope = false;
  // $.event.special['touch'] = {
  //  // This method gets called the first time this event
  //  // is bound to THIS particular element. It will be
  //  // called once and ONLY once for EACH element.
  //  add: function(eventData, namespaces) {
  //    // var target = globalScope ? $(document) : $(this),
  //    var target = $(this),
  //      origTarget = $(this);

  //    var isTouch = navigator.userAgent.match(/(iPad|iPhone|iPod|Android|BlackBerry)/ig);

  //    console.log(eventData, namespaces);
  //    var $el = $(this);
  //    // $el.unbind('click');
  //    // $el.unbind('hover');
  //    // $el.unbind('touchstart');
  //    // $el.unbind('touchcancel');
  //    // $el.unbind('touchmove');
  //    // $el.unbind('touchend');
  //    // For development purposes, and in case this mobile-optimized experience 
  //    // is being consumed on a P&C (point and click) device, 
  //    // use click instead of touch when necessary
  //    if(!isTouch) {

  //      $el.bind('click', function(e) {
  //        $el.trigger('touch',e);
  //      });
  //    }
  //    // else {
  //    console.log("$el", $el);
  //    // When the user touches
  //    $el.on('touchstart', function(e) {
  //      alert("touchstart!!!");
  //      window.clearTimeout($el.data('countdownToTapped'));
  //      $el.data('countdownToTapped', window.setTimeout(function() {
  //        $el.addClass('tapped');
  //      }, 5));

  //      // Always stop propagation on touch events
  //      // Sorry :(
  //      e.stopPropagation();

  //      // TODO: Prevent default scroll behavior (in certain situations)
  //      // e.preventDefault();
  //    });

  //    // When the user lets go
  //    // Touchend cancels the tapCountdown timer
  //    // It also fires the event we're interested in if the tapped state is already set
  //    $el.on('touchend', function(e) {

  //      if($el.hasClass('tapped')) {
  //        $el.trigger('touch', e);
  //      } else {
  //        window.clearTimeout($el.data('countdownToTapped'));
  //      }
  //    });

  //    // Touchcancel cancels the tapCountdown timer
  //    // If the user's finger wanders into browser UI, or the touch otherwise needs to be canceled, the touchcancel event is sent
  //    $el.on('touchcancel', function() {

  //      if($el.hasClass('tapped')) {
  //        $el.removeClass('tapped');
  //      } else {
  //        window.clearTimeout($el.data('countdownToTapped'));
  //      }
  //    });

  //    // Touchmove cancels the countdownToTapped timer, as well as cancelling the tapped state if it is set
  //    $el.on('touchmove', function(e) {

  //      if($el.hasClass('tapped')) {
  //        $el.removeClass('tapped');
  //      } else {
  //        window.clearTimeout($el.data('countdownToTapped'));
  //      }

  //      // Prevent propagation of scrolling
  //      // e.stopPropagation();
  //      // TODO: Prevent default scroll behavior (in certain situations)
  //      e.preventDefault();
  //    });

  //    // Return void as we don't want jQuery to use the
  //    // native event binding on this element.
  //    return;
  //  },

  //  // This method gets called when this event us unbound
  //  // from THIS particular element.
  //  remove: function(namespaces) {

  //    var isTouch = navigator.userAgent.match(/(iPad|iPhone|iPod|Android|BlackBerry)/ig);
  //    var $el = $(this);

  //    if(!isTouch) $el.unbind('click');
  //    $el.unbind('touchstart');
  //    $el.unbind('touchend');
  //    $el.unbind('touchmove');
  //    $el.unbind('touchcancel');

  //    // Return void as we don't want jQuery to use the
  //    // native event binding on this element.
  //    return;
  //  }
  // };



});


// Components are the smallest unit of event handling and logic
// Components may contain sub-components, but (as of may 12th 2012),
// they are responsible for calling render on those elements
Mast.Component = {
  // Default HTML to display if table is empty and no emptytemplateis specified
  emptyHTML: "<span>This collection is empty.</span>",

  // Default HTML to display if collection is being loaded from server
  loadingHTML: "<span>Loading...</span>",

  // HTML to display if nothing can be loaded from the server
  errorHTML: "<span>The specified URL did not return valid data.</span>",

  // Automatic rendering is enabled by default
  autoRender: true,

  // If no binding exists for a given attribute, rip the entire template out of the DOM and put it back in
  naiveRender: true,

  // Set to true the first time this element is appended to the DOM
  // used for figuring out when to trigger afterCreate
  appendedOnce: false,

  /**
   * attributes: properties to be added directly to the component
   *              i.e. accessible from component as:
   *                  this.someThing
   *                  this.someThingElse
   *
   * modelAttributes: properties to be added directly to the component's Model
   *              i.e. accessible from component as:
   *                  this.get('someThing')
   *                  this.get('someThingElse')
   *
   * dontRender: whether or not to render this component when it is instantiated
   *              default: false
   */
  initialize: function(attributes, modelAttributes, dontRender) {
    // Bind context
    _.bindAll(this);

    // Bring in attributes
    _.extend(this, attributes);

    // Watch for and announce events
    this.on('beforeCreate', this.beforeCreate);
    this.on('afterCreate', this.afterCreate);
    this.on('afterRender', this.afterRender);
    this.on('beforeRender', this.beforeRender);
    this.on('beforeClose', this.beforeClose);
    this.on('afterClose', this.afterClose);
    this.on('beforeRoute', this.beforeRoute);
    this.on('afterRoute', this.afterRoute);

    // Maintain dictionaries of subcomponent prototypes
    this.regions = this.regions || {};

    // and instances
    this.children = {};

    // Custom event bindings for specific model attributes
    this.bindings = this.bindings || {};


    // Backwards compatibility for autorender / autoRender
    this.autoRender = (this.autorender !== undefined) ? this.autorender : this.autoRender;

    // Parse special notation on left side of events hash
    _.each(this.events, function(handler, name) {
      var splitName = name.split(/\s+/g);
      if(splitName.length > 1 && splitName[1].substr(0, 1) == '>') {
        // This is a closest_descendant event so generate new name of event
        var newName = name.replace(/(\S+\s+)>/g, "$1"); // i.e. "click >.button"
        delete this.events[name];
        var newHandler = function(e) {
            // Stop event from propagating up to superclass
            e.stopImmediatePropagation();
            _.isString(handler) ? this[handler](e) : _.bind(handler, this)(e);
            return false;
          };
        _.bind(newHandler, this);
        this.events[newName] = newHandler;
      }
    }, this);


    // Build pattern  
    if(_.isUndefined(this.template)) {
      throw new Error("No pattern or template selector specified for component!");
    } else {
      // Create pattern from model and template
      this.pattern = new Mast.Pattern({
        template: this.template,
        model: this.model ? this.model : new Mast.Model()
      });
    }

    // Provide direct access to model from component
    this._modelIdentifier = this.model;
    this.model = this.pattern.model;

    // If this belongs to another component, disable autoRender
    // if (this.parent) {
    //  this.autoRender = false;
    // }
    // Extend model with properties specified
    _.each(modelAttributes, function(val, key) {
      this.pattern.set(key, val, {silent:true});
    }, this);

    // Watch for changes to pattern
    this.pattern.on('change', this.render);

    // Trigger beforeCreate and init (legacy) events
    _.result(this, 'init');
    this.trigger('beforeCreate');

    // If this is being created by a parent element, don't render
    if(!this.parent && this.autoRender !== false /*&& !dontRender*/ ) {
      this.append();
    }

    // Listen for when the socket is live
    // (unless it's already live)
    if(Mast.Socket) {
      if(!_.isObject(Mast.Session)) {
        Mast.Socket.off('sessionUpdated', this.afterConnect);
        Mast.Socket.on('sessionUpdated', this.afterConnect);
      } else {
        Mast.Socket.off('sessionUpdated', this.afterConnect);
        this.afterConnect();
      }
    }

    // Listen to subscriptions
    if(this.subscriptions) {

      var self = this;

      // Bind trigger subscriptions to backbone events
      _.each(this.getSubscriptionSubset("%"), function (trigger) {
        var action = self.subscriptions[trigger];
        action =  _.isFunction(action) ? action : self[action];
        action = _.bind(action,self);

        // Trigger action with dispatched arguments
        var triggerName = _.str.ltrim(trigger,'%');
        Mast.on(triggerName,action);
      });

      
      Mast.on("all", function(dispatchedPattern) {

        // Grab dispatched arguments
        var dispatchedArguments = _.toArray(arguments);
        dispatchedArguments.shift();


        // Bind actions to DOM events
        var pattern = dispatchedPattern.match(/^event:(.*)/);
        if (pattern && pattern.length == 2) {

          // Look for matching event subscription
          _.each(this.getSubscriptionSubset("$"), function (event) {
            // If a matching event subscription exists, apply it with dispatched arguments
            if (event === pattern[1]) {
              var action = self.subscriptions[event];
              action =  _.isFunction(action) ? action : self[action];
              action = _.bind(action,self);
              action.apply(self,dispatchedArguments);
            }
          });
        }

        // When dispatcher triggers a route event
        pattern = dispatchedPattern.match(/^route:(.*)/);
        if (pattern && pattern.length === 2) {
          pattern = pattern[1];
          self.trigger('beforeRoute');

          // Look for matching route subscription and trigger it
          self.triggerRouteSubscription(pattern); 
          
          self.trigger('afterRoute');
        }
      },this);

      
      // Bind comet events
      _.each(this.getSubscriptionSubset("~"), function(route) {
        var action = self.subscriptions[route];
        action =  _.isFunction(action) ? action : self[action];
        action = _.bind(action,self);
        Mast.Socket.subscribe(route, _.isFunction(action) ? action : this[action], this);
      }, this);
    }
    else {
      this.subscriptions = {};
    }
  },

  // Look for matching route subscription and trigger it
  triggerRouteSubscription: function ( pattern ) {
    var self = this;
    _.each(this.getSubscriptionSubset("#"), function (route) {

      // Normalize index synonym
      route = (route === "#" || route === "#index") ? "#" : route;

      // If pattern matches, disambiguate and trigger action
      var params = Mast.mixins.matchRoutePattern(pattern,route);
      if (params) {
        var action = self.subscriptions[route];
        action =  _.isFunction(action) ? action : self[action];
        action = _.bind(action,self);

        // Run action with combined params
        action.apply(self,params);
      }
    });   
  },

  // Get subset of events based on symbol
  getSubscriptionSubset: function (symbol) { 
    return _.filter(_.keys(this.subscriptions || {}),function (key) {
      return key[0] === symbol;
    }); 
  },

  // Append this component's rendered HTML to the outlet
  append: function() {
    // Determine outlet and context
    var context = this.parent && this.parent.$el,
      $outlet = Mast.mixins.verifyOutlet(this.outlet, context);

    // Render pattern without firing the afterRender event
    this.render(true);

    // If the template has an id, and an element with that id already exists, throw an error
    if( !! this.$el.attr('id') && $("#" + this.$el.attr('id')).length > 0) {
      throw new Error('Trying to render a template with id (#' + this.$el.attr('id') + '), but an element with that id already exists in the DOM!');
    }

    // If template is falsy, don't append anything to outlet
    if(!this.template) {} else {
      // Append rendered element to the DOM
      $outlet.append && $outlet.append(this.$el);
    }

    // Trigger afterCreate if it hasn't been triggered yet
    if(!this.appendedOnce) {
      this.appendedOnce = true;
      this.trigger('afterCreate');

      // If the current url hash matches a route subscription, trigger it
      // (it won't have fired yet since the component didn't exist until now)
      this.triggerRouteSubscription(window.location.hash);
    }

    // Then trigger afterRender
    this.trigger('afterRender');
    return this;
  },

  // Append the component's rendered HTML at a specific position amongst its siblings in the outlet
  insert: function(index) {
    // Determine outlet and context
    var context = this.parent && this.parent.$el,
      $outlet = Mast.mixins.verifyOutlet(this.outlet, context);

    // Render pattern without firing the afterRender event
    this.render(true);

    // If the template has an id, and an element with that id already exists, throw an error
    if( !! this.$el.attr('id') && $("#" + this.$el.attr('id')).length > 0) {
      throw new Error('Trying to render a template with id (#' + this.$el.attr('id') + '), but an element with that id already exists in the DOM!');
    }

    // Append element at the appropriate index
    var elementAtIndex = $outlet.children().eq(index);
    elementAtIndex.before(this.$el);

    // Trigger afterCreate if it hasn't been triggered yet
    if(!this.appendedOnce) {
      this.appendedOnce = true;
      this.trigger('afterCreate');
    }

    // Then trigger afterRender
    this.trigger('afterRender');
    return this;
  },

  // Render the pattern and subcomponents
  render: function(silent, changes) {
    !silent && this.trigger('beforeRender', changes);
    
    // if (this.appendedOnce ? this.naiveRender : true) {

    // If naiveRender is true, always use naiverender if bindings don't cover all our bases
    // otherwise, just do it the first time
    if (!this.appendedOnce || (this.appendedOnce && this.naiveRender)) {
      // Determine if all changed attributes are bound
      var allBound = _.all(changes, function(attrVal, attrName) {
        return !_.isUndefined(this.bindings[attrName]);
      }, this);

      // if not all attribute changes are bound, or there are no explicit changes, naively rerender
      if(!allBound || !changes) {
        this.doNaiveRender(true, changes);
      }
      // Otherwise, perform the specific bindings for this changeset
      else {
        this.runBindings(changes);
      }
    }
    else {
      this.runBindings(changes);
    }

    !silent && this.trigger('afterRender', changes);
    return this;
  },

  // Run the binding functions as they apply to the specified changeset
  // or if no changeset is specified, render all bindings
  runBindings: function(changes) {
    var bindingsToPerform = _.keys(changes || this.bindings);
    _.each(bindingsToPerform, function(attrName) {
      var handler = this.bindings[attrName];
      if(handler) {
        // Run binding if a function
        if(_.isFunction(handler)) {
          handler = _.bind(handler, this);
          handler(this.get(attrName));
        }
        // For string selector bindings, replace the value or text
        // (depending on whether this is a form input element or not)
        else if (_.isString(handler)) {
          var $el = this.$el.closest_descendant(handler);
          if (!$el || !$el.length) throw new Error('No element can be found for binding selector: '+handler);
          var nodeName = $el.get(0).nodeName.toLowerCase();
          var formy = nodeName === 'input' || nodeName === 'select' || nodeName === 'option' || nodeName === 'button' || nodeName === 'optgroup' || nodeName === 'textarea';
          formy ? $el.val(this.get(attrName)) : $el.text(this.get(attrName));
        }
        else throw new Error("Bindings contain invalid or non-existent function.");
      }
    }, this);
  },

  // Rip existing element out of DOM, replace with new element, then render subcomponents
  doNaiveRender: function(silent) {
    // If template is falsy, don't try to render it
    if(!this.template) {} else {
      var $element = this.generate();
      this.$el.replaceWith($element);
      this.setElement($element);
    }

    // Render regions either way
    this.renderRegions(silent);
  },

  // Render the regions for this component
  renderRegions: function(silent, changes) {
    var self = this;
    !silent && this.trigger('beforeRender', changes);
    _.each(this.regions, function (subcomponent,outletSelector) {
      self.renderRegion(subcomponent,outletSelector);
    });
    !silent && this.trigger('afterRender', changes);
  },

  // Render a particular region
  // @model - optional
  renderRegion: function(subcomponent, outletSelector, model) {
    var subcomponentPrototype;
    // console.log("Rendering region ",subcomponent," into ",outletSelector, " WITH DATA: ",model);
    // If subcomponent is a valid tree object, render a subcomponent for each model in collection into region
    // ******************************************************
    // TODO: Pull this code into provisionPrototype
    // ******************************************************
    if(_.isObject(subcomponent) && subcomponent.collection && subcomponent.component) {

      // Build a Tree prototype out of definition
      var def = {
        template: null,
        collection: subcomponent.collection,
        emptyHTML: subcomponent.emptyHTML,
        branchComponent: subcomponent.component
      };
      if(subcomponent.emptyHTML) {
        def.emptyHTML = subcomponent.emptyHTML;
      }
      subcomponentPrototype = Mast.Tree.extend(def);
    }
    // ******************************************************
    // Otherwise render a normal subcomponent into region
    else {
      subcomponentPrototype = Mast.mixins.provisionPrototype(subcomponent, Mast.components, Mast.Component);
    }

    // Close existing component
    this.children[outletSelector] && this.children[outletSelector].close();

    // Create instantiation definition for new subcomponent
    var newComponentDef = {
      outlet: outletSelector,
      parent: this
    };

    // TODO: Use extendsFrom to accomplish this effect.
    // If model parameter is set, include model in subcomponent
    if(model) {
      console.warn("WARNING: Specifying a model in attach() will soon be deprecated.  Please use extendsFrom instead.");
      newComponentDef.model = model;
    }

    // Create and save new component
    this.children[outletSelector] = new subcomponentPrototype(newComponentDef);

    // append new component to DOM (if subcomponent's autorender is true)
    if(this.children[outletSelector].autoRender) {
      this.children[outletSelector].append();
    }
  },

  // Attach a new subcomponent to an outlet in this component
  // @model - optional
  attach: function(outletSelector, subcomponent, model) {
    this.regions[outletSelector] = subcomponent;
    this.renderRegion(subcomponent, outletSelector, model);
  },

  // Detach all subcomponents from a region
  detach: function(outletSelector) {
    if(this.children[outletSelector]) {
      this.children[outletSelector].close();
      delete this.regions[outletSelector];
    }
  },

  // Get a child component by outlet
  child: function(outletSelector) {
    return this.children[outletSelector];
  },
  childAt: function(outletSelector) {
    return this.child(outletSelector);
  },

  // Use pattern to generate a DOM element
  generate: function(data) {
    // console.log("GENERATE'S THIS:",this, this && this._class);
    data = this._normalizeData();
    return $(this.pattern.generate(data));
  },

  // Free the memory for this component and remove it from the DOM
  close: function(silent) {
    !silent && this.trigger('beforeClose');

    // Destroy all subcomponents
    _.invoke(this.children, 'close');

    // Unsubscribe to model change events
    this.pattern.off();
    this.off();

    // Unsubscribe all events on dispatcher with this context
    Mast.off(null,null,this);

    // Remove from DOM
    this.$el.remove();

    // TODO: Unsubscribe to comet updates
    !silent && this.trigger('afterClose');
  },

  // Set pattern's template selector
  setTemplate: function(selector, options) {
    options = _.defaults(options || {}, {
      render: true
    });

    // If a render function is specified, use that
    if(_.isFunction(options.render)) {
      // call custom transition function with current and new elements (in the proper scope)
      _.bind(options.render, this);
      options.render(this.$el, this.generate());
    }
    // Otherwise just do a basic render by triggering the default behavior
    else {
      this.pattern.setTemplate(selector, options);
    }
    return this.$el;
  },

  // Handle both `"key", value` and `{key: value}` -style arguments.
  _normalizeArgs: function(key, value, options, transformedFn) {
    var attrs;
    if(_.isObject(key) || key === null) {
      attrs = key;
      options = value;
    } else {
      attrs = {};
      attrs[key] = value;
    }
    transformedFn(attrs, options);
  },

  // Change model as a result of set
  _changeModel: function(attrs, options) {
    options = _.defaults(options || {}, {
      render: true
    });

    // If a render function is specified, use that
    if(_.isFunction(options.render)) {
      // call custom transition function with current and new elements (in the proper scope)
      this.pattern.set(attrs, _.extend(options, {
        silent: true
      }));
      options.render = _.bind(options.render, this);
      options.render(this.$el, this.generate());
      // Fire afterRender unless silent:true was set in options
      !options.silent && this.trigger('afterRender', attrs);
    }
    // Otherwise just do a basic render by triggering the default behavior
    else {
      this.pattern.set(attrs, options);
    }
  },

  // Set pattern's model attribute
  // If the first argument is an object, value can also be an options hash
  set: function(key, value, options) {
    var self = this;
    self._normalizeArgs(key, value, options, function(attrs, options) {
      self._changeModel(attrs, options);
    });
  },

  increment: function(key, amount, options) {
    var self = this;
    self._normalizeArgs(key, amount, options, function(attrs, options) {
      attrs = _.objMap(attrs, function(amt, key) {
        return self.get(key) + amt;
      });
      self._changeModel(attrs, options);
    });
  },
  decrement: function(key, amount, options) {
    var self = this;
    self._normalizeArgs(key, amount, options, function(attrs, options) {
      attrs = _.objMap(attrs, function(amt, key) {
        return self.get(key) - amt;
      });
      self._changeModel(attrs, options);
    });
  },

  // Pass-thru to model.save()
  save: function() {
    this.pattern.model.save(null, {
      silent: true
    });
  },

  // 
  fetchModel: function () {
    this.model.fetch();
  },

  fetch: function () {
    return this.fetchModel();
  },

  // Pass-thru to model.get()
  get: function(attribute) {
    return this.pattern.get(attribute);
  },

  beforeCreate: function() {
    // stub
  },

  afterCreate: function() {
    // stub
  },

  beforeRender: function() {
    // stub
  },

  afterRender: function() {
    // stub
  },

  beforeClose: function() {
    // stub
  },

  afterClose: function() {
    // stub
  },

  afterConnect: function() {
    // stub
  },
  
  beforeRoute: function () {
    
  },
  
  afterRoute: function () {
    
  },

  // Used for debugging
  _test: function() {
    debug.debug("TEST FUNCTION FIRED!", arguments, this);
  }
};



// A Tree is a special Component that may handle events for a
// homogenous collection of child components.
// 
// It also provides an API for performing CRUD operations on that
// collection, both on the clientside and over the Socket using
// Backbone REST-style semantics.
Mast.Tree = {
  
  // Keeps track of hot branch components for memory management
  _branchStack: [],

  isLoading: false,
  
  initialize: function (attributes,options) {
        
    // Determine whether specified branch component is a className, class, or instance
    this.branchComponent = (this.branchComponent && 
      Mast.mixins.provisionPrototype(this.branchComponent,Mast.components,Mast.Component));
    
    // Determine whether specified collection is a className, class, or instance
    // and replace with a valid instance if necessary
    this.collection = Mast.mixins.provisionInstance(this.collection,Mast.models,Mast.Collection);
        
    // Mixin scaffold subscriptions
    // Default subscriptions (for scaffolds)
    var defaultSubscriptions = {},entity = _.str.trim(this.collection.url,'/');
    if (entity) {
      defaultSubscriptions["~"+entity+'/create'] = function (attributes) {
        this.collection.add(attributes);
      };
      defaultSubscriptions["~"+entity+'/:id/update'] = function (id,attributes) {
        this.collection.get(id).set(attributes);
      };
      defaultSubscriptions["~"+entity+'/:id/destroy'] = function (id) {
        this.collection.remove(id);
      };
      this.subscriptions = _.defaults(this.subscriptions || {},defaultSubscriptions);
    }
        
    // Initialize main component
    Mast.Component.prototype.initialize.call(this,attributes,options);
    
    // Watch for collection changes
    var self = this;
    if (this.collection) {
      this.collection.on('remove',function(model,collection,options) {
        self.removeBranch(model,options);
      });
      this.collection.on('add',function(model,collection,options) {
        self.appendBranch(model,options);
      });
      this.collection.on('reset',function(collection,options) {
        self.renderBranches();
      });
    }
  },
      
  // Render the underlying component+subcomponents (and branches if necessary)
  render: function (silent,changes) {
    !silent && this.trigger('beforeRender');
    Mast.Component.prototype.render.call(this,true,changes);
    !silent && this.trigger('afterRender');
  },
  
  // Do a standard component naive render, but also rerender branches
  doNaiveRender: function (silent,changes) {
    Mast.Component.prototype.doNaiveRender.call(this,silent,changes);
    this.renderBranches(silent,changes);
  },
  
  // Render the Tree's branches
  renderBranches: function (silent,changes) {
    !silent && this.trigger('beforeRender');

    // If no branchOutlet is explicitly specified, use the current outlet
    // Otherwise use the branchOutlet selector to find the branchOutlet element inside of this.$el
    this.$branchOutlet = (this.branchOutlet) ? 
      Mast.mixins.verifyOutlet(this.branchOutlet,this.$el) : 
      Mast.mixins.verifyOutlet(this.outlet,this.parent && this.parent.$el);
    
    // Empty branch outlet and close any lingering branch components
    this.$branchOutlet.empty();
    _.invoke(this._branchStack,'close');
    this._branchStack = [];
    
    // Append branches, empty HTML, or loading HTML to the branchOutlet
    if (this.collection && this.isLoading && (this.loadingHTML || this.loadingTemplate)) {
      this.$branchOutlet.append(this._generateLoadingHTML());
    }
    else if (this.collection && !this.collection.length) {
      this.$branchOutlet.append(this._generateEmptyHTML());
    }
    else {
      var self = this;
      this.collection && this.collection.each(function(model,index){
        self.appendBranch(model,{},true);
      });
    }

    !silent && this.trigger('afterRender');
  },
  
  // Add a new branch
  appendBranch: function (model,options,silent) {
    if (!this.branchComponent) { throw new Error ('No branchComponent specified!'); }
    // If this is the first branch, empty to remove the emptyHTML element
    if (this.collection && this.collection.length == 1) {
      this.$branchOutlet.empty();
    }
    // Generate component
    var r = new this.branchComponent({
      parent: this,
      autoRender: false,
      model: model,
      outlet: this.$branchOutlet
    });
    
    // Add at a position
    if (options && !_.isUndefined(options.at)) {
      r.insert(options.at);
      // Push or splice branch component to stack for garbage collection
      this._branchStack.splice(options.at,0,r);
    }
    // or append to the end
    else {
      r.append();
      // Push or splice branch component to stack for garbage collection
      this._branchStack.push(r);
    }
    
    !silent && this.trigger('afterRender');
  },
  
  // Remove a branch
  removeBranch: function (model,options,silent) {
    // Garbage collect branch
    var branch = this._branchStack[options.index];
    if (!branch) debug.warn('Branch missing from memory manager!');
    else {
      branch.close();
      this._branchStack.splice(options.index,1);
    }
    
    // Render empty HTML if necessary
    if (this.collection && this.collection.length === 0 ) {
      this.$branchOutlet.append(this._generateEmptyHTML());
    }
    !silent && this.trigger('afterRender');
  },
  
  // Extend Component's close method to also free branches
  close: function () {
    _.invoke(this._branchStack,'close');
    this._branchStack = [];
    Mast.Component.prototype.close.call(this);
  },
  
  // Lookup the element for the id'th branch
  getBranchEl: function (id) {
    return this.getBranchesEl().eq(id);
  },
      
  // Lookup $ set of all Branches
  getBranchesEl: function () {
    return this.$branchOutlet.children();
  },

  // Fetch collection and model
  fetch: function (data) {
    this.fetchCollection(data);
    this.fetchModel(data);
  },

  // fetch items in this collection
  // keep track of isLoading state
  fetchCollection: function (data) {
    var self = this;
    self.isLoading = true;

    // Render loading state if relevant
    this.renderBranches();
    return this.collection.fetch({
      data: data,
      success: function () {
        self.isLoading = false;
        self.renderBranches();
      },
      error: function () {
        self.isLoading = false;
      }
    });
  },
      
  // Generate empty tree html
  _generateEmptyHTML: function () {
    if (this.emptyTemplate) {
      var pattern = new Mast.Pattern({
        template: this.emptyTemplate
      });
      return $(pattern.generate());
    }
    else {
      return this.emptyHTML;
    }
  },

  // Generate loading html
  _generateLoadingHTML: function () {
    if (this.loadingTemplate) {
      var pattern = new Mast.Pattern({
        template: this.loadingTemplate
      });
      return $(pattern.generate());
    }
    else {
      return this.loadingHTML;
    }
  }
}


// Extend Backbone structures
Mast.Pattern = Mast.View.extend(Mast.Pattern);
Mast.Component = Mast.Pattern.extend(Mast.Component);
Mast.Tree = Mast.Component.extend(Mast.Tree);
Mast.Table = Mast.Component.extend(Mast.Table);


// Define registration methods (required to extend other components/models in the app)
Mast._registerQueue = [];
var registerFn = function(entityType) {
  return function (entityName,definition) {
    Mast._registerQueue.push({
      name:   entityName,
      type:   entityType,
      definition: _.extend({
        _class:entityName
      },definition)
    });
  };
};

Mast.registerComponent  = registerFn('component');
Mast.registerTree   = registerFn('tree');

Mast.registerModel    = registerFn('model');
Mast.registerCollection = registerFn('collection');

// "Smart"-register (take a guess at what sort of entity this is)
Mast.register = function (entityName,definition) {
  var entityType;
  if (!definition.template) {
    entityType = definition.model ? 'collection' : 'model';
  }
  else {
    entityType = 
      (definition.collection || 
      definition.branchOutlet || 
      definition.branchComponent) ? 'tree' : 'component';
  }
  Mast._registerQueue.push({
    name:   entityName,
    type:   entityType,
    definition: _.extend({
      _class:entityName
    },definition)
  });
};


