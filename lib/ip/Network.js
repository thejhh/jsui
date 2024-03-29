/* JavaScript Application Framework -- Example code
 * Copyright 2010 Jaakko-Heikki Heusala <jhh@jhh.me>
 * $Id: Network.js 413 2010-10-15 04:41:36Z jheusala $
 */

/* Server-side code for JSON UI test */
var GLOBAL = {};
GLOBAL.debug = "";

			/** Netmask object constructor */
			function Netmask(q) {
			    if(this instanceof arguments.callee) {
					GLOBAL.debug += "new Netmask('" + q + "')<br />\n";
			        if(!q.match(/\./)) {
			            this.cidr = parseInt(q, 10);
						GLOBAL.debug += "cidr is " + this.cidr + "<br />\n";
			        } else {
						GLOBAL.debug += "q = '" + q + "'<br />\n";
    			        var parts = q.split('.');
						GLOBAL.debug += "part[0] = '" + parts[0] + "'<br />\n";
			            var ip_value = (parseInt(parts[0],10)<<24)
							+(parseInt(parts[1],10)<<16)
							+(parseInt(parts[2],10)<<8)
							+parseInt(parts[3],10);
			            var bit=0;
			            for(; (bit<32) && !(ip_value&(1<<bit)); bit++);
			            this.cidr = 32-bit;
			        }
				} else {
					GLOBAL.debug += "Netmask('" + q + "')<br />\n";
			        return new Netmask(q);
		    	}
			}

			/** Calculate alternative netmask format (like 255.255.255.0) */
			Netmask.prototype.getLegacy = function() {
				var alternative_netmask = '';
			    for(var i=0; i<4; i++) {
					if(i!==0) alternative_netmask += '.';
					alternative_netmask += (((0xffffffff<<(32-this.cidr)) & 0xffffffff) >> (8*(3-i)))&0x000000ff;
				}
				return alternative_netmask;
			}

			/** Get netmask as a string presentation */
			Netmask.prototype.toString = function() {
				return this.cidr;
			}

			/** Network object constructor */
			function Network(q) {
				if(this instanceof arguments.callee) {
					this.address = q;
					this.netmask = 32;
					if( (q.length != 0) && (q.search('/') !== -1) ) {
						var parts = q.split('/');
						this.address = parts[0];
						this.netmask = Netmask(parts[1]);
					}
				} else {
					return new Network(q);
				}
			}

			/** Returns amount of hosts in a network */
			Network.prototype.getHosts = function() {
				return Math.pow(2, 32-this.netmask);
			}

			/** Get list of addresses in the network */
			Network.prototype.getAddresses = function() {
				var list = [];
				var hosts = this.getHosts();
				var raw = this.address.split('\.', 5);
				var binaddr = ((((raw[0])&0xff)<<24)&0xff000000) | ((raw[1]&0xff)<<16) | ((raw[2]&0xff)<<8) | (raw[3]&0xff);
				for(var i=0; i<hosts; i++) {
					list.push( ((((binaddr)&0xff000000)>>24)&0xff) + '.'
					   + (((binaddr&0x00ff0000)>>16)&0xff) + '.'
					   + (((binaddr&0x0000ff00)>>8)&0xff) + '.'
					   + (binaddr&0x000000ff)
					   );
					binaddr++;
				}
				return list;
			}
			
			/** Get list of addresses in the network */
			Network.prototype.toString = function() {
				return this.address + '/' + this.netmask;
			}
			
/* EOF */
