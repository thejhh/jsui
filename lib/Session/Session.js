/* JavaScript Session Library
 * Copyright 2010 Jaakko-Heikki Heusala <jhh@jhh.me>
 * $Id:$
 */

/* Private part of the source code */
(function(global) {
	
	/* Session global configurations */
	var __config = {
		"session_dir":"./sessions",
	};
	
	/* Characters to use in random session IDs */
	var __chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	
	/* External interfaces */
	if(!global.Filesystem) {
		global.Extension.load("filesystem");
	}
	var __fs = global.Filesystem;
	
	/** File-based Session storage implementation.
	 */
	global.SessionFile = function(file) {
		if(!(this instanceof arguments.callee)) return new global.SessionFile(args);
		if(!file) throw TypeError("filename invalid: "+file);
		this._file = ""+file;
	};
	
	/** Copy session data from object source to dest, skipping internal members with keys named '_*'.
	 * @params source Source object
	 * @params dest Destination object. If undefined, new object is created.
	 * @returns Object without keys named '_*'
	 */
	function __copy_session_members(source, dest) {
		if(!(source && (typeof source === "object"))) throw TypeError("invalid source: "+source);
		var dest = dest || {};
		for(var i in source) if(source.hasOwnProperty(i) && /^[^_]/.test(i)) dest[i] = source[i];
		return dest;
	}
	
	/** Saves session data to file
	 * @params session Reads data from this object
	 */
	global.SessionFile.prototype.save = function(session) {
		try {
			if(!(session && (typeof session === "object"))) throw TypeError("session invalid: "+session);
			__fs.writefile(this._file, global.JSON.stringify( __copy_session_members(session) ) );
		} catch(e) {
			throw Error("Failed to save file: " + this._file + ": " + e);
		}
	};
	
	/** Load session data from file
	 * @params session Saves loaded data to this object
	 */
	global.SessionFile.prototype.load = function(session) {
		try {
			if(!(session && (typeof session === "object"))) throw TypeError("session invalid: "+session);
			if(__fs.exists(this._file)) __copy_session_members(global.JSON.parse(__fs.readfile(this._file)), session);
		} catch(e) {
			throw Error("Failed to load file: " + this._file + ": " + e);
		}
	};
	
	/** Returns string presentation of the store object */
	global.SessionFile.prototype.toString = function() {
		return "SessionFile("+this._file+")";
	}
	
	/** Returns true if store most likely can be used as session store */
	function __is_session_store(store) {
		return ( store && (typeof store === 'object') &&
		       store.load && (typeof store.load === 'function') && 
		       store.save && (typeof store.save === 'function') ) ? true : false;
	}
	
	/** Session object constructor.
	 * @param session_id Session ID
	 * @param store Session storage object
	 * @returns Session object
	 */
	global.Session = function(session_id, store) {
		if(!(this instanceof arguments.callee)) return new (global.Session)(store);
		if(!session_id) throw TypeError("session_id is invalid");
		if(!__is_session_store(store)) throw TypeError("store is invalid");
		this._session_id = session_id;
		this._store = store;
		this._store.load(this);
	}
	
	/** Save the session data to internal store */
	global.Session.prototype.save = function() {
		this._store.save(this);
		return this;
	}
	
	/** Returns internal session store object */
	global.Session.prototype.getStore = function() {
		return this._store;
	}
	
	/** Returns string presentation of the store object */
	global.Session.prototype.toString = function() {
		return "Session("+this._session_id+")";
	}
	
	/** Returns session ID */
	global.Session.prototype.getSessionID = function() {
		return ""+this._session_id;
	}
	
	/* Get a string with random contents */
	function __create_random_string(size) {
		
		/* Get random integer number between 0..x */
		function rand(x) { return Math.floor(Math.random()*x); }
		
		/* Get a character from __chars from a random index */
		function f() {
			var n = rand(__chars.length);
			return __chars.substring(n,n+1);
		}
		
		var size = size || 8;
	    var tmp = "";
	    for(var i=0; i<size; i++) tmp += f();
	    return tmp;
	}
	
	/* Generate session id */
	function __create_session_id() {
		return __create_random_string(64);
	}
	
	/** Directory-based Session storage implementation.
	 */
	global.SessionDirectory = function(dir) {
		if(!(this instanceof arguments.callee)) return new (global.SessionDirectory)(dir);
		if(!dir) throw TypeError("invalid directory: "+dir);
		if(!__fs.isDirectory(dir)) throw TypeError("invalid directory: "+dir);
		this._dir = ""+dir;
	};
	
	/** Get filename for session */
	global.SessionDirectory.prototype.getFilename = function(session_id) {
		if(!session_id) throw TypeError("invalid session_id: "+session_id);
		return this._dir + "/sess" + session_id + ".json";
	}
	
	/** Get new session ID */
	global.SessionDirectory.prototype.getFreshSessionID = function() {
		var id = __create_session_id();
		if(__fs.exists(this.getFilename(id))) return this.createSessionID();
		return id;
	}
	
	/** Initialize fresh new session object and save a initial copy of it to the filesystem
	 * @returns Session object
	 */
	global.SessionDirectory.prototype.getFreshSession = function() {
		var session_id = this.getFreshSessionID();
		return (new global.Session(session_id, new global.SessionFile(this.getFilename(session_id)))).save();
	}
	
	/** Load session based on session ID
	 * @returns Session object
	 */
	global.SessionDirectory.prototype.load = function(session_id) {
		if(!session_id) return this.getFreshSession();
		var filename = this.getFilename(session_id);
		if(!__fs.exists(filename)) return this.getFreshSession();
		return new global.Session(session_id, new global.SessionFile(filename));
	}
	
/* End of private source code */
})(this);

/* EOF */
