/*
 * Dump JavaScript variables as strings
 */

/** Returns string presentation of all arguments */
String.dump = function() {
	var out = [];
	var args_len = arguments.length;
	for(var i=0; i<args_len; ++i) {
		var value = arguments[i];
		var type = typeof value;
		if( (type == "number") || (type == "boolean") || (type == "function") || (type == "undefined") ) {
			out.push(""+value);
			continue;
		}
		if(type == "string") {
			out.push("\""+value+"\"");
			continue;
		}
		if( (type == "object") && (value instanceof Array) ) {
			var tmp = [];
			var len = value.length;
			for(var j=0; j<len; ++j) tmp.push(String.dump(value[j]));
			out.push("["+tmp.join(', ')+"]");
			continue;
		}
		if(type == "object") {
			var tmp = [];
			for(j in value) if(value.hasOwnProperty(j)) tmp.push(j+":"+String.dump(value[j]));
			out.push("{"+tmp.join(', ')+"}");
			continue;
		}
		throw new Error("Unknown type: " + type);
	}
	return out.join(', ');
}

/* EOF */
