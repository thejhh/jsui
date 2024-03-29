/* jsonobject.js -- Extends JSON to support isolated objects
 * Copyright 2010 Jaakko-Heikki Heusala <jhh@jhh.me>
 * $Id: jsonobject.js 464 2010-10-16 04:34:04Z jheusala $
 */

/** Special element constructor for JSON to implement extended object serialization
 * @params name string Name of the object constructor
 * @params value string Objects data
 */
function JSONObject (name, value) {
	var undefined;
	if(this instanceof arguments.callee) {
		if(name === undefined) throw TypeError("name undefined");
		if(value === undefined) throw TypeError("value undefined");
		this.name = ""+name;
		this.value = ""+value;
	} else {
		return new JSONObject(name, value);
	}
}

/** Check if the value should be presented in the extended format
 * @params v String value to test
 * @returns true if should use extended format, false otherwise.
 */
JSONObject.__use_extended_format = function(v) {
	var l = v.length;
	return (l < 2) ? false : (((v.charAt(l-1) === ")") && (v.indexOf("(") !== -1)) ? true : false);
}

/** Check if the value should be presented in the extended format
 * @returns true if should use extended format, false otherwise.
 */
JSONObject.prototype.__use_extended_format = function() {
	if(this.name !== "String") return true;
	return JSONObject.__use_extended_format(this.value);
}

/** The valueOf() method returns the primitive value of a JSONObject. */
JSONObject.prototype.valueOf = function() {
	if(this.__use_extended_format()) return this.name + "(" + this.value + ")";
	return this.value;
};

/** Revives JSONObject back to the original value
 * @returns instance of same type as the original JavaScript object
 */
JSONObject.prototype.reviver = function() {
	if( JSONObject.revivers[this.name] &&
	   (typeof JSONObject.revivers[this.name] === "function") ) {
		return (JSONObject.revivers[this.name])(this.value);
	}
	throw new ReferenceError("could not find reviver for " + this.name);
};

/** Convert JSONObject as JSON string
 * @note We need to use our own replacer to isolate normal strings and the 
         extended from each other, therefore it has no .toJSON().
JSONObject.prototype.toJSON = function() {
	return this.name + "(" + this.value + ")";
};
*/

/* Override .toJSON()'s to support our extended JSONObject */
String.prototype.toJSON    = function() { return new JSONObject("String", this.valueOf() ); };
Date.prototype.toJSON      = function() { return new JSONObject("Date",   this.getTime() ); };

/* JSONObject revivers */
JSONObject.revivers = {};
JSONObject.revivers.String = function(value) { return ""+value; };
JSONObject.revivers.Date   = function(value) {
	if(/^[0-9]+$/.test(value)) return new Date(parseInt(value, 10));
	throw TypeError("illegal value: "+value);
};

/* Setup all exceptions with .toJSON() and revivers */
(function(global) {
	var exceptions = ["Error", "EvalError", "RangeError", "ReferenceError", "SyntaxError", "TypeError", "URIError"];
	for(var i in exceptions) if(exceptions.hasOwnProperty(i)) {
		(function(global, name) {
			global[name].prototype.toJSON = function() { return new JSONObject(name, this.message); };
			JSONObject.revivers[name] = function(value) { return new (global[name])(value); };
		})(global, exceptions[i]);
	}
})(this);

/** Replacer to implement support for JSONObject extension
 * @throws TypeError if a string is detected, because all normal strings should 
 *         have been converted to JSONObject by their .toJSON().
 */
JSONObject.replacer = function(key, value) {
	if(typeof value === "string") return JSONObject("String", value).valueOf();
	if(value && (typeof value === "object") && (value instanceof JSONObject) ) return value.valueOf();
	return value;
};

/** Convert primitive presentation back to an object
 * @params value String Primitive presentation of JSONObject in format "ClassName(Value)"
 * @returns new instance of the JSONObject
 * @throws TypeError if illegal string content is detected.
 */
JSONObject.parse = function(value) {
	var value = ""+value;
	if(!JSONObject.__use_extended_format(value)) return new JSONObject("String", value);
	
	var items = value.split("(");
	if(items.length < 2) throw new TypeError("illegal input: "+value);
	var name = items.shift();
	var data = items.join("(");
	if(data.charAt(data.length-1) != ')') throw new TypeError("illegal input: "+value);
	return new JSONObject(name, data.substr(0, data.length-1));
};

/** Reviver to implement support for JSONObject extension
 * 
 */
JSONObject.reviver = function(key, value) {
	if(typeof value !== 'string') return value;
	return JSONObject.parse(value).reviver();
};

/* Override JSON.parse and JSON.stringify to use our extended format by default */
(function() {
	var __JSON_parse = JSON.parse,
	    __JSON_stringify = JSON.stringify;
	JSON.parse     = function(item, r) { return __JSON_parse    (item, r || JSONObject.reviver);  };
	JSON.stringify = function(item, r) { return __JSON_stringify(item, r || JSONObject.replacer); };
})();

/* EOF */
