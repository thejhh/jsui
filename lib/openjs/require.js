(function(global) {
/* server.js -- Server-side example code for JSON UI test
 * Copyright 2010 Jaakko-Heikki Heusala <jhh@jhh.me>
 * $Id: require.js 421 2010-10-15 05:25:35Z jheusala $
 */

if(!global.require) {
	global.require = function(file) {
		if( global && global.Extension && (typeof global.Extension.load === 'function') ) {
			global.Extension.load(file);
		}
	};
}

/* EOF */
})(this);
