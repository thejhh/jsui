(function(global) {
/* server.js -- Server-side example code for JSON UI test
 * Copyright 2010 Jaakko-Heikki Heusala <jhh@jhh.me>
 * $Id: server.js 513 2010-10-19 15:22:12Z jheusala $
 */

require("./lib/jsapp/jsapp.js");
require("./lib/json/jsonobject.js");
require("./lib/jsui/common.js");
require("./lib/Session/Session.js");

var app = new JSApp();

app.setLayout("example.html");

var session_dir = new SessionDirectory("../../tmp/jsui/sessions");
app.setSessionStore(session_dir);
app.setSessionCookieName("JsAppExampleID");
app.setSessionCookieAttrs({"secure":true});

app.setup("index", "Welcome! This is a jsUI test site." );

/* File menu */
app.setup("file.save", UIMessage("Not implemented.") );
app.setup("file.quit", UIMessage("Not implemented.") );

/* Example of returning data record */
app.setup("show.record", function() {
	return {
		"__caption__":"Test record",
		"username":"foo",
		"realname":"Foo Bar",
		"date": new Date(),
	};
});

/* Example of returning data record */
app.setup("show.session", function(options, request) {
	function makeRecord(caption, obj) {
		var ret = {"__caption__":caption};
		for(var i in obj) if(obj.hasOwnProperty(i) && /^[^_]/.test(i)) ret[i] = obj[i];
		return ret;
	}
	
	var session = request.getSession();
	return makeRecord("Session Record Data", session.record);
});

/* Example of returning data in a table */
app.setup("show.table", function() {
	return [
		"__caption__:Test table",
		{"a":1,"b":2,"c":3, "date":new Date(2009,0,1)},
		{"a":4,"b":5,"c":6, "date":new Date(2010,0,1)},
	];
});

/* Example of editing a record */
app.setup("edit.record", function(options) {
	var response = [];
	
	response.push({
		"__type__":"form",
		"__caption__":"Test form",
		"__name__":"record",
		"username":"foo",
		"realname":"Foo Bar",
		"date": new Date(),
		"active": true,
		"city": {"__selected__":"2", "1":"Helsinki", "2":"Oulu", "3":"Tampere"},
		"id": 1000,
		"sum": 1234.5678,
	});
	
	var record = options.record;
	if(record) {
		record["__caption__"] = "Received data from the form";
		response.push(record);
	}
			
	return (response.length === 1) ? response.shift() : response;
});

/* Example of editing a record */
app.setup("edit.session", function(options, request) {
	
	var session = request.getSession();
	if(!session.record) session.record = {
		"username":"foo",
		"realname":"Foo Bar",
		"date": new Date(),
		"active": true,
		"city": "Oulu",
		"id": 1000,
		"sum": 1234.5678,
	};
	
	var response = [];
	
	if(options.record) {
		session.record = options.record;
		response.push(UIMessage("success", "Record saved."));
	}
	
	function makeForm(obj) {
		var ret = {
			"__type__":"form",
			"__caption__":"Test form",
			"__name__":"record",
		};
		for(var i in obj) if(obj.hasOwnProperty(i) && /^[^_]/.test(i)) ret[i] = obj[i];
		return ret;
	}
	
	response.push(makeForm(session.record));
	
	return (response.length === 1) ? response.shift() : response;
});

/* Example of editing a table */		
app.setup("edit.table", UIMessage("Not implemented.") );

/* Network address tool */
app.setup("tools.network", function(options) {
	
	require("./lib/ip/Network.js");
	
	var response = [];
	var network_name = options.network;
	
	response.push({
		"__type__":"form",
		"__caption__":"Calculate network information",
		"network": network_name ? network_name : "",
	});
	
	if(network_name) {
		var n = Network(network_name);
		var record = {};
		record["__caption__"] = 'Network ' + n;
		record["Address"] = ""+n.address;
		record["CIDR netmask"] = "/"+n.netmask;
		record["Alternative netmask"] = ''+n.netmask.getLegacy();
		record["Hosts"] = ""+n.getHosts();
		response.push(record);
		response.push(n.getAddresses());
	}
	
	return (response.length === 1) ? response.shift() : response;
});

/* About this program */	
app.setup("help.about", [
	"This is an example of a simple JSON-based application framework. It uses "+
	"both client and server side JavaScript. It can be used as standalone "+
	"from the server or the client side.",
	
	"The server side is powered by Google v8 JavaScript engine (OpenJS.org). It "+
	"JIT compiles the code into machine readable format before running it.",
	
	"It would be simple task to implement GUI or ncurses based library for this "+
	"framework."
]);

/* About this program */	
app.setup("help.version", [
	"Server: $Id: server.js 513 2010-10-19 15:22:12Z jheusala $",
]);

/* About this program */	
app.setup("help.license", [
	"Licensed under the GPL version 2.",
]);

/* About this program */	
app.setup("debug.dump", function(options) {
	require("./lib/dump/dump.js");
	return ["Dump of the program code: ", String.dump(app.__code)];
});

/* Navigation */
app.setup("bits.nav", {
	"__type__":"menu",
	"file":{"save":"","quit":""},
	"show":{"record":"","table":"","session":""},
	"edit":{"record":"","table":"","session":""},
	"tools":{"network":""},
	"help":{"about":"","version":"","license":""},
	"config":{
		"client":{
			"preferences":"",
		},
	},
});

/* Start the system */
app.run();

/* EOF */
})(this);
