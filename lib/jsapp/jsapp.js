/* JavaScript Application Framework -- Source Code
 * Copyright 2010 Jaakko-Heikki Heusala <jhh@jhh.me>
 * $Id: jsapp.js 516 2010-10-19 16:13:08Z jheusala $
 */

/* Private part of the source code */
(function(global) {
	
	var __default_session_cookie_name = "JSAPP_SESSID";
	var __default_session_cookie_attrs = {};
	
	/** Constructor for application */
	global.JSApp = function(code) {
		
		function __is_object(obj) {
			return (obj && (typeof obj === "object")) ? true : false;
		}
		
		var undefined;
		if(this instanceof arguments.callee) {
			var code = code || {};
			if(!__is_object(code)) throw new Error("code is not an object");
			this.__code = code;
			this.__layout_file = "layout.html";
		} else {
			return new global.JSApp(code);
		}
	};

	/** Check if value is an object
	 * @returns True if value is an object, otherwise false.
	 */
	function __is_object(obj) {
		return (obj && (typeof obj === "object")) ? true : false;
	}
	
	/** Check if value is an array
	 * @returns True if value is an array, otherwise false.
	 */
	function __is_array(obj) {
		return (obj && (typeof obj === "object") && (obj instanceof Array)) ? true : false;
	}
	
	/** Convert string-based path to Array
	 * @param path String path to convert
	 * @returns Array converted array
	 */
	function __get_path(path) {
		if(typeof path === "string") return path.replace(/^[\.\/]+/, "").split(/[\.\/]+/);
		if(__is_array(path)) return path;
		throw new Error("Cannot convert path: " + path);
	}
	
	/** Compiles a copy from the obj. Functions will be called as f(options) 
	 * and their result values are used in the place of the original function.
	 * @returns Copied obj without functions.
	 */
	function __compile_callbacks(obj, options) {
		
		// Handle functions
		if(typeof obj === "function") {
			return obj(options);
		}
		
		// Handle arrays
		if(obj && (typeof obj === "object") && (obj instanceof Array)) {
			var ret = [];
			for(var i in obj) if(obj.hasOwnProperty(i)) ret.push(__compile_callbacks(obj[i], options));
			return ret;
		}
		
		// Handle objects
		if(obj && (typeof obj === "object")) {
			var ret = {};
			for(var i in obj) if(obj.hasOwnProperty(i)) { ret[i] = __compile_callbacks(obj[i], options); }
			return ret;
		}
		
		// Anything else as itself
		return obj;
	}
	
	/** Lookup sub objects inside a root object based on a path. If functions are encountered, a call will be made to them with options as an argument and the lookup is continued inside the return value from the function call.
	 * @param root Object Root object of the path location
	 * @param path String|Vector Path as an array of strings
	 * @param options Object Options to pass to a function calls
	 * @param args object Arguments to the functions. If property make-missing-paths is set, all missing paths are created as objects.
	 * @returns The last value where path points to.
	 */
	function __lookup(root, path, options, args) {
		var undefined;
		var args = args || {};
		if(typeof path === "string") path = __get_path(path);
		
		if(!__is_object(root)) throw new Error("root is not object");
		if(!__is_array(path)) throw new Error("path is not Array");
		if(!__is_object(options)) throw new Error("options is not object");
		
		if(path.length === 0) return root;
		
		var k = path.shift();
		
		if( (root[k] === undefined) && (args["make-missing-paths"]) ) root[k] = {};
		
		var obj;
		if(root[k] && (typeof root[k] === "object")) obj = root[k];
		else if(typeof root[k] === "function") obj = (root[k])(options, args.system);
		else obj = root[k];
		
		if(path.length === 0) return obj;
		if(!__is_object(obj)) throw new Error("object lookup error at " + k);
		return __lookup(obj, path, options, args);
	}
	
	/** Request handler
	 * @param Object Program code object
	 * @param request
	 * @param app
	 * @returns Nothing.
	 */
	function __do_request(code, request, app) {
		var undefined;
		try {
			var headers = [], content_type, content_body;
			
			request.setHeader = function(value) {
				headers.push(""+value);
			};
			
			request.setCookie = function(key, value, attrs) {
				this.setHeader( (new Cookie(key, value, attrs)).raw() );
			};
			
			var session;
			request.getSession = function() {
				if(!session) session = app.getSessionStore().load(request.cgi.cookies[app.getSessionCookieName()]);
				return session;
			};
			
			function __finish_session() {
				if(session) {
					session.save();
					request.setCookie(app.getSessionCookieName(), session.getSessionID(), app.getSessionCookieAttrs());
				}
			}
			
			try {
			
				if(!__is_object(code)) throw new Error("code is not object");
				if(!__is_object(request)) throw new Error("request is not object");
				if(!__is_object(app)) throw new Error("app is not object");
				
				var post = request.cgi.post;
				var get = request.cgi.get;
				
				/* args will contain values from get and post */
				var args = {};
				if(get) for(i in get) if(get.hasOwnProperty(i)) { args[i] = get[i]; }
				if(post) for(i in post) if(post.hasOwnProperty(i)) { args[i] = post[i]; }
				
				var content = "No content.";
				var use_legacy = args.legacy;
				var action = args.action || "index";
				
				if(args.type === "json") {
				
					if(action) {
						var next_opts = JSON.parse(args.options || "{}");
						var c = __lookup(code, ""+action, next_opts, {"system":request} );
						if(c !== undefined) content = c;
					}
					
					// Print response as JSON
					content_type = "application/json";
					content_body = JSON.stringify(content);

				} else {
					
					/* Implements Legacy Support for browsers that do not support JavaScript */
					require("./lib/jsui/jsui.js");
					
					$UI('preferences').set({
						"useLegacy":true,
						"backendFastCGI":'server.fcgi',
						"backendStdCGI":'server.cgi',
						"useFastCGI": request.fastcgi ? true : false,
						"fixBrowserBackButton":false,
						"fixBrowserBackButtonTimer":200,
					});
					
					/* */
					function __do_local_request(action, options, ui) {
						var undefined;
						var options = options || {};
						var c = __lookup(code, ""+action, options );
						if(c !== undefined) ui.content(c);
						else ui.content("Request failed!");
					}
					
					/* Generate output */
					var __output = {};
					function $ID(n) { return {"save":function(c) { __output[n] = c; }};}
					$UI('nav').setRequestCallback(__do_local_request).start($ID('nav'), undefined, '/bits/nav');
					$UI().setRequestCallback(__do_local_request).start($ID('content'), undefined, action);
					
					var options = {};
					if(args.type && args.prev && args.next) {
						options = UserInterface.__object_normalize(args.type, args.prev, args.next);
						$UI().refresh(action, options);
					}
					
					/* Write content */
					require("filesystem");
					var out = Filesystem.readfile(app.layout());
					/* FIXME: Finding place from the layout should be handled much better way. */
					if(__output.nav) out = out.replace('<div id="nav"><p class="info">Loading... 0%</p></div>', '<div id="nav">'+__output.nav+'</div>');
					if(__output.content) out = out.replace('<div id="content"><p class="info">Loading... 0%</p></div>', '<div id="content">'+__output.content+'</div>');
					
					// Print response as HTML
					content_type = "text/html";
					content_body = out;

				}
				
			} catch(e) {
				content_type = "application/json";
				content_body = JSON.stringify(UIMessage("error", ""+e));
				system.stderr.writeln("jsapp.js: Exception: " + e);
				if(e.stack) system.stderr.writeln("stack:\n" + e.stack);
			} finally {
				__finish_session();
			}
			request.setHeader("Content-Type: "+content_type);
			var response = headers.join("\n") + "\n\n" +
			               content_body;
			request.stdout.write(response);
			return;
					
		} catch(e) {
			system.stderr.writeln("jsapp.js: Exception: " + e);
			if(e.stack) system.stderr.writeln("stack:\n" + e.stack);
		}
	}
	
	/** Setup code into the place of path
	 * @params path String|Array Path where to inject the code
	 * @params code mixed New application code
	 * @params options mixed Options to pass to possible functions we encounter
	 * @returns Object Self
	 * @todo Support for array-based path
	 */
	JSApp.prototype.setup = function(path, code, options) {
		if(typeof path === "string") path = __get_path(path);
		if(!__is_array(path)) throw new Error("path is not Array");
		if(!__is_object(options)) options = {};
		
		// Change the root element if path points to nothing
		if(path.length === 0) {
			if(code === undefined) code = {};
			if(!__is_object(code)) throw new Error("code is not an object");
			this.__code = code;
			return this;
		}
		
		// Make path to point to the parent object and get the keyword to the element
		var key = path.pop();
		
		// Get parent object
		if(!__is_object(this.__code)) throw new Error("this.__code is not object");
		var parent = __lookup(this.__code, path, options, {"make-missing-paths":true});
		if(!__is_object(parent)) throw new Error("parent is not object");
		
		// Set the code
		parent[key] = code;
		
		return this;
	};
	
	/** Run the application using CGI or as a FastCGI
	 * @returns Nothing
	 */
	JSApp.prototype.run = function() {
		var app = this;
		try {
			require("system");
			require("fastcgi");
			require("cgi");
			require("./lib/json/jsonobject.js");
			
			/* Print debug information */
			function print_debug(request) {
				system.stderr.writeln("--DEBUG--");
				for(var i in request.env) if(request.env.hasOwnProperty(i)) {
					system.stderr.writeln("env."+i+" = '" + request.env[i] + "'");
				}
				if(request.cgi.get) {
					for(var i in request.cgi.get) if(request.cgi.get.hasOwnProperty(i)) {
						system.stderr.writeln("get."+i+" = '" + request.cgi.get[i] + "'");
					}
				}
				if(request.cgi.post) {
					for(var i in request.cgi.post) if(request.cgi.post.hasOwnProperty(i)) {
						system.stderr.writeln("post."+i+" = '" + request.cgi.post[i] + "'");
					}
				}
				system.stderr.writeln("---end---");
			}
			
			/* Handle CGI or FastCGI */
			if(FastCGI.IsCGI()) {
				system.cgi = cgi;
				//print_debug(system);
				if(!__is_object(app.__code)) throw new Error("app.__code is not object");
				__do_request(app.__code, system, app);
			} else {
				FastCGI.runner(function(request) {
					//print_debug(request);
					__do_request(app.__code, request, app);
				});
			}
			
		/* Catch errors */
		} catch(e) {
			system.stderr.writeln("jsapp.js: error: " + e);
			if(e.stack) system.stderr.writeln("stack:\n" + e.stack);
		}
	};
	
	/** Set layout file name */
	JSApp.prototype.setLayout = function(file) {
		if(!file) throw TypeError("invalid file: "+file);
		this.__layout_file = ""+file;
		return this;
	}
	
	/** Set layout file name */
	JSApp.prototype.layout = function(file) {
		if(file) return this.setLayout(file);
		return this.__layout_file;
	}
	
	/** Set session store device */
	JSApp.prototype.setSessionStore = function(store) {
		this.__session_store = store;
		return this;
	}
	
	/** Set session cookie name */
	JSApp.prototype.setSessionCookieName = function(name) {
		this.__session_cookie_name = name;
		return this;
	}
	
	/** Set session attributes */
	JSApp.prototype.setSessionCookieAttrs = function(attrs) {
		this.__session_cookie_attrs = attrs;
		return this;
	}
	
	/** Get session store device */
	JSApp.prototype.getSessionStore = function() {
		if(!this.__session_store) throw Error("No session store defined");
		return this.__session_store;
	}
	
	/** Get session cookie name */
	JSApp.prototype.getSessionCookieName = function() {
		if(!this.__session_cookie_name) return __default_session_cookie_name;
		return this.__session_cookie_name;
	}
	
	/** Get session cookie name */
	JSApp.prototype.getSessionCookieAttrs = function() {
		if(!this.__session_cookie_attrs) return __default_session_cookie_attrs;
		return this.__session_cookie_attrs;
	}
	
/* End of private source code */
})(this);

/* EOF */
