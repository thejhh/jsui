/* server.js -- Server-side example code for JSON UI test
 * Copyright 2010 Jaakko-Heikki Heusala <jhh@jhh.me>
 * $Id: example.js 459 2010-10-15 09:38:50Z jheusala $
 */

function __body_onload() {
	
	$UI('preferences').set({
		"backendFastCGI":'server.fcgi',
		"backendStdCGI":'server.cgi',
		"useFastCGI":true,
		"fixBrowserBackButton":true,
		"fixBrowserBackButtonTimer":200,
	});
	
	function $ID(n) {
		return {
			"save":function(content) {
				var e = document.getElementById(n);
				if(!e) throw new Error("Could not save content for ID: " + n);
				e.innerHTML = content;
			}};
	}
	
	$UI().start($ID('content'));
	$UI('nav').start($ID('nav'), undefined, '/bits/nav');
}

/* EOF */
