/* JavaScript JSON test */
Extension.load("system");

/** Override default toJSON to a dummy version. Does not actually convert it to 
 * JSON at all so that our own replacer can handle it.
 */
if (typeof Date.prototype.toJSON !== 'undefined') {
	Date.prototype.toJSON = function() { return this; }
}

/** Common JSON reviver */
function __common_json_replacer(key, value) {
	if( (typeof value === "object") && (value instanceof Date) ) return "Date(" + value.getTime() + ")";
	if(typeof value === "string") return "String(" + value.valueOf() + ")";
	return value;
}

/** Common JSON reviver */
function __common_json_reviver(key, value) {
	//system.stderr.writeln("__common_json_reviver('"+key+"', '"+value+"')");
	if(typeof value === 'string') {
		if( /^Date\([0-9]+\)$/.test(value) ) {
			var matches = /^Date\(([0-9]+)\)$/.exec(value);
			var time = matches[1];
			var d = new Date();
			d.setTime(time);
			return d;
		}
		if( /^String\(.*\)$/.test(value) ) {
			var matches = /^String\((.*)\)$/.exec(value);
			return ""+matches[1];
		}
	}
	return value;
}

/** Override default toJSON to a dummy version. Does not actually convert it to 
 * JSON at all so that our own replacer can handle it.
 */
Date.prototype.toJSON = function() { return this; }

/** Common JSON reviver */
function __common_json_replacer(key, value) {
	if( (typeof value === "object") && (value instanceof Date) ) return "Date(" + value.getTime() + ")";
	if(typeof value === "string") return "String(" + value.valueOf() + ")";
	return value;
}

/** Common JSON reviver */
function __common_json_reviver(key, value) {
	//system.stderr.writeln("__common_json_reviver('"+key+"', '"+value+"')");
	if(typeof value === 'string') {
		if( /^Date\([0-9]+\)$/.test(value) ) {
			var matches = /^Date\(([0-9]+)\)$/.exec(value);
			var time = matches[1];
			var d = new Date();
			d.setTime(time);
			return d;
		}
		if( /^String\(.*\)$/.test(value) ) {
			var matches = /^String\((.*)\)$/.exec(value);
			return ""+matches[1];
		}
	}
	return value;
}

/* The test code */

var values = [
	"hello",
	"Date(1286849838326)", 
	new Date(),
];
for(var i in values) if(values.hasOwnProperty(i)) {
	system.stdout.writeln( "JSON.stringify('" + values[i] + "') == '" + JSON.stringify(values[i], __common_json_replacer) + "'" );
}
system.stdout.write("\n");

values = [
	"\"String(Hello)\"",
	"\"Date(1286849838326)\"", 
];
for(var i in values) if(values.hasOwnProperty(i)) {
	system.stdout.writeln( "JSON.parse('" + values[i] + "') == '" + JSON.parse(values[i], __common_json_reviver) + "'" );
}

/* EOF */
