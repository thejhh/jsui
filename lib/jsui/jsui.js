/* JavaScript User Interface Library -- Source Code
 * Copyright 2010 Jaakko-Heikki Heusala <jhh@jhh.me>
 * $Id: jsui.js 492 2010-10-17 22:51:59Z jheusala $
 */

/* User interface constructor */
function UserInterface() {
	var undefined;
	if(this instanceof arguments.callee) {
		this.__backend = undefined;
		this.__content = "No content";
		this.__elements = [];
	} else {
		return new UserInterface();
	}
}

/** Main interface to the framework */
function $UI (resource) {
	if(resource === "preferences") {
		return {"set":function(settings) { UserInterface.preferences(settings); }};
	}
	return UserInterface["$UI"](resource);
}

/* Private part of the source code */
(function(global) {
	
	/* Check if we have an Ajax support */
	var __hasAjax = (global && global.Ajax && (typeof global.Ajax.Request === 'function') ) ? true : false;
	
	/* User Interface Preferences */
	var __preferences = {
		"useLegacy":false,
		"backendFastCGI":'server.fcgi',
		"backendStdCGI":'server.cgi',
		"useFastCGI":true,
		"fixBrowserBackButton":true,
		"fixBrowserBackButtonTimer":200,
	};
	
	/* Setup preferences */
	UserInterface.preferences = function(settings) {
		for(var i in settings) if(settings.hasOwnProperty(i)) {
			if(typeof __preferences[i] !== typeof settings[i]) throw new Error("mismatching types!");
			__preferences[i] = settings[i];
		}
	}
	
	/* Get current backend URL from preferences */
	function __get_backend() {
		return __preferences.useFastCGI ? __preferences.backendFastCGI : __preferences.backendStdCGI;
	}
	
	/* Location hash refresh fix */
	var __location_hash_timer, __location_hash;
	if(__preferences.fixBrowserBackButton && global.location && global.location.hash && global.setTimeout) {
		__location_hash_timer;
		__location_hash = global.location.hash;
		function __checkLocationHashChange() {
			if(__location_hash !== global.location.hash) {
				__location_hash = global.location.hash;
				$UI().refresh();
			}
			if(__preferences.fixBrowserBackButton && global.setTimeout) {
				__location_hash_timer = global.setTimeout(__checkLocationHashChange,
		            parseInt(__preferences.fixBrowserBackButtonTimer || 200, 10));
			}
		}
		__checkLocationHashChange();
	}
	
	/* */
	function __ltrim (str) {
		return (""+str).replace(/^\s+/g, "");
	}
	
	function __rtrim (str) {
	    return (""+str).replace(/"\s+$/g, "");
	}
	
	function __trim (str) {
	    return __ltrim(__rtrim(str));
	}
	
	/* Parse date */
	function __parse_date(arg) {
		//alert("__parse_date("+ arg+")");
		if(arg instanceof Date) return arg;
		
		var str = __trim(arg).replace(/ *([\.:]) */g, "$1").replace(/  +/g, " ");
		// Post add optional time
		if(str.search(/^[0-9]{1,2}\.[0-9]{1,2}\.[0-9]{4}$/) != -1) str += " 12:00:00";
		
		// Post add optional seconds
		if(str.search(/^[0-9]{1,2}\.[0-9]{1,2}\.[0-9]{4} [0-9]{1,2}\.[0-9]{2}$/) != -1) str += ".00";
		if(str.search(/^[0-9]{1,2}\.[0-9]{1,2}\.[0-9]{4} [0-9]{1,2}:[0-9]{2}$/) != -1) str += ":00";
	
		// Set time as null if incorrect
		if(str.search(/^[0-9]{1,2}\.[0-9]{1,2}\.[0-9]{4} [0-9]{1,2}([:\.])[0-9]{2}\1[0-9]{2}$/) == -1) return null;
		
		// Split pairs
		var datetime = str.split(" ", 2);
		var date_pairs = datetime[0].split(".", 3);
		var time_pairs = datetime[1].split(/[.:]/, 3);
		
		var year    = parseInt(date_pairs[2], 10);
		var month   = parseInt(date_pairs[1].replace(/^0+/, ""), 10)-1;
		var day     = parseInt(date_pairs[0].replace(/^0+/, ""), 10);
		
		var hours   = parseInt(time_pairs[0].replace(/^0+/, "").replace(/^$/, "0"), 10);
		var minutes = parseInt(time_pairs[1].replace(/^0+/, "").replace(/^$/, "0"), 10);
		var seconds = parseInt(time_pairs[2].replace(/^0+/, "").replace(/^$/, "0"), 10);
		
		// Return Date object
		var d = new Date( year, month, day, hours, minutes, seconds);
		//alert("__parse_date: Parsed date: " + d);
		if(d.getFullYear() !== year) return null;
		if(d.getMonth() !== month) return null;
		if(d.getDate() !== day) return null;
		if(d.getMinutes() !== minutes) return null;
		if(d.getHours() !== hours) return null;
		if(d.getSeconds() !== seconds) return null;
		return d;
	}

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
	
	/* Escape string for XML */
	function __escape_xml (arg) {
		return (""+arg).replace(/&/g, "&amp;")
			.replace(/"/g, "&quot;")
			.replace(/"/g, "&quot;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/'/g, "&#039;");
	}
	
	/* Normalize new data based on types.
	 * @param type Types for data
	 * @param prev Previus data
	 * @param next Data after changes
	 * @returns the normalized object
	 */
	UserInterface.__object_normalize = function(type, prev, next) {
		if(!__is_object(type)) throw new Error("type is not object");
		if(!__is_object(prev)) throw new Error("prev is not object");
		if(!__is_object(next)) throw new Error("next is not object");
		
		var undefined;
		var result = {};
		for(var i in type) if(type.hasOwnProperty(i)) {
			if( (type[i] === "boolean") && (next[i] === undefined) ) result[i] = false;
			else if(next[i] === undefined) continue;
			else if(typeof type[i] === "object") result[i] = UserInterface.__object_normalize(type[i], prev[i], next[i]);
			else if(type[i] === "Date") result[i] = __parse_date(next[i]);
			else if(type[i] === "undefined") result[i] = undefined;
			else if(type[i] === "null") result[i] = null;
			else if(type[i] === "boolean") result[i] = (next[i] === "1") ? true : false;
			else if(type[i] === "number") result[i] = /\./.test(next[i]) ? parseFloat(next[i]) : parseInt(next[i], 10);
			else if(type[i] === "string") result[i] = ""+next[i];
			else throw new Error("Unknown type for " + i + ": " + type[i] );
		}
		return result;
	}
	
	/* Set content backend */
	UserInterface.prototype.backend = function(backend) {
		this.__backend = ""+backend;
		return this;
	};
	
	/* Set callback to handle requests for new data */
	UserInterface.prototype.setRequestCallback = function(f) {
		if(f && (typeof f === 'function')) this.__do_request = f;
		else throw new TypeError("argument is not a function");
		return this;
	};
	
	/* Check if element has correct callbacks set */
	function __is_element(e) {
		return e && (typeof e === "object") && (typeof e.save === "function");
	}
	
	/* Initialize user interface. Usually called from the onload method. */
	UserInterface.prototype.start = function(element, backend, action) {
		if(!__is_element(element)) throw TypeError("element is not suitable");
		if(!backend) backend = __get_backend();
		this.__elements.push(element);
		if(backend) this.backend(backend);
		this.__current_action = action;
		this.draw();
		if(action) this.refresh(action);
		else this.refresh();
		return this;
	};
	
	/* Set content */
	UserInterface.prototype.content = function(data) {
		this.__content = data;
		this.draw();
		return this;
	};
	
	/* Call method on every element */
	UserInterface.prototype.save = function(arg) {
		for(var e in this.__elements) if(this.__elements.hasOwnProperty(e)) {
			this.__elements[e].save(arg);
		}
		return this;
	};

	/* Draw content to current elements */
	UserInterface.prototype.draw = function() {
		var undefined;
		
		/* Returns true if argument is an array and contains similar objects */
		function isArrayTable(data) {
			var keys;
			if(!(data instanceof Array)) return false;
			for(var i in data) if(data.hasOwnProperty(i)) {
				if( (typeof data[i] === "string") && data[i].substr(0, 12) === "__caption__:" ) continue;
				if(!(data[i] instanceof Object)) return false;
				if(keys === undefined) {
					keys = {};
					for(var k in data[i]) if(data[i].hasOwnProperty(k)) {
						keys[""+k] = true;
					}
				} else {
					for(var k in data[i]) if(data[i].hasOwnProperty(k)) {
						if(!keys[""+k]) return false;
					}
					for(var k in keys) if(keys.hasOwnProperty(k)) {
						if(!data[i][""+k]) return false;
					}
				}
			}
			return true;
		}
	
		/* Get the code for hidden HTML element
		 * @returns HTML code
		 */
		function get_html_input_hidden(name, value) {
			return "<input type=\"hidden\""+
			       " name=\""+__escape_xml(name)+"\""+
			       " value=\"" + __escape_xml(value) + "\""+
			       " />";
		}
		
		/* Get the type of the value (the real type)
		 * @returns Type as a string
		 */
		function __get_type(value) {
			var type = typeof value;
			if(type !== "object") return type;
			if(!value) return "null";
			if(value instanceof Date) return "Date";
			if(value instanceof Array) return "Array";
			return "object";
		}
		
		/* Get the code for presenting exceptions and errors
		 * @returns HTML code
		 */
		function get_html_message(className, e) {
			return "<div class=\""+__escape_xml(className)+"\">"+__escape_xml(""+e)+"</div>\n";
		}
		
		/* Convert dates to our string format */
		Date.prototype.toUIFormat = function() {
			function f(n) { return n<10 ? "0"+n : n; }
			return f(this.getDate())  + "." + f(this.getMonth()+1) + "." + this.getFullYear() + " " +
			       f(this.getHours()) + ":" + f(this.getMinutes()) + ":" + f(this.getSeconds());
		}
		
		/* Get prepared value for user input fields
		 * @returns Prepared value
		 */
		function __get_prepared_value(value) {
			if( value && (typeof value === "object") && (typeof value.toUIFormat === 'function') ) return value.toUIFormat();
			return value;
		}
		
		/* Get the code for HTML checkbox input element
		 * @returns An array. First field contains the code for the input field 
		 *          and the second is optional keyword field if it can be presented 
		 *          separated from the input field.
		 */
		function get_html_input_checkbox(keyword, value, id, name) {
			if(!id) id = "form_elem_" + keyword;
			var name = name?name:keyword;
			return [get_html_input_hidden("prev."+name, value)+"\n"+
			       get_html_input_hidden("type."+name, __get_type(value))+"\n"+
			       "<label for=\"" + __escape_xml(id) + "\"\"><input type=\"checkbox\"" +
			       " id=\"" + __escape_xml(id) + "\"" +
			       " name=\"next." + __escape_xml(name) + "\"" +
			       " value=\"1\"" +
			       (value ? " checked=\"checked\"" : "") +
			       " />&nbsp;" + __escape_xml(keyword) + "</label>", __escape_xml(keyword)];
		}
		
		/** Get the code for HTML checkbox input element
		 * @returns An array. First field contains the code for the input field 
		 *          and the second is optional keyword field if it can be presented 
		 *          separated from the input field.
		 */
		function get_html_option(keyword, value, id, selected) {
			return ["<option" +
			       (id      ? " id=\"" + __escape_xml(id) + "\""         : "") +
			       (value ? " value=\"" + __escape_xml(value) + "\"" : "") +
			       (selected ? " selected=\"selected\"" : "") +
			       ">" + __escape_xml(keyword) +
			       "</option>"];
		}
		
		/** Get the code for HTML checkbox input element
		 * @returns An array. First field contains the code for the input field 
		 *          and the second is optional keyword field if it can be presented 
		 *          separated from the input field.
		 */
		function get_html_select(keyword, value, id, name) {
			var selected = value["__selected__"];
			var name = name?name:keyword;
			var code = get_html_input_hidden("prev."+name, selected)+"\n"+
			       get_html_input_hidden("type."+name, __get_type(selected))+"\n"+
			       "<select" +
			       (id ? " id=\"" + __escape_xml(id) + "\"" : "") +
			       " name=\"next." + __escape_xml(name) + "\"" +
			       ">\n";
			code += get_html_option("undefined", "") + "\n";
			for(var i in value) if(value.hasOwnProperty(i)) {
				if(i === "__selected__") continue;
				code += get_html_option(value[i], i, undefined,
				        ( (selected===undefined) ? undefined : (i == selected) ) ) + "\n";
			}
			code += "</select>";
			return [code, __escape_xml(keyword)];
		}
		
		/* Get the code for HTML input element
		 * @returns An array. First field contains the code for the input field 
		 *          and the second is optional keyword field if it can be presented 
		 *          separated from the input field.
		 */
		function get_html_input(keyword, value, id, name) {
			if(__get_type(value) === "boolean") return get_html_input_checkbox(keyword, value, id, name);
			if(__get_type(value) === "object") return get_html_select(keyword, value, id, name);
			var type = __get_type(value);
			var prepared_value = __get_prepared_value(value);
			var name = name?name:keyword;
			return [get_html_input_hidden("prev."+name, prepared_value)+"\n"+
			       get_html_input_hidden("type."+name, type)+"\n"+
			       "<input type=\"text\"" +
			       (id ? " id=\"" + __escape_xml(id) + "\"" : "") +
			       " name=\"next." + __escape_xml(name) + "\"" +
			       " value=\"" + __escape_xml(prepared_value) + "\"" +
			       " />", __escape_xml(keyword)];
		}
		
		/* Get link to path */
		function __get_link_href(path) {
			if(__preferences.useLegacy) return __get_backend() + "?legacy=1&action=" + escape(path);
			return "#" + path;
		}
		
		/** Get <ul> HTML element
		 * @params data
		 * @params ui
		 * @params args.path
		 * @params args.class_name
		 * @params args.label
		 * @params args.item_class
		 * @returns HTML code
		 */
		function get_ul(data, ui, args) {
			if(!args.path) args.path = "";
			var content = "<ul";
			if(args.class_name) content += " class=\"" + __escape_xml(args.class_name) + "\"";
			content += ">\n";
			if(args.label) {
				var path = ( (typeof data==="string") && (data !== "") ) ? data : args.path;
				content += "<li class=\"top\"><a href=\"" + __escape_xml(__get_link_href(path)) + "\"" +
				           " onclick=\"$UI().refresh('" + __escape_xml(path) + "')\"" +
				           ">" + __escape_xml(args.label) + "</a></li>\n";
			}
			if( data && (typeof data === "object") ) {
				for(var k in data) if(data.hasOwnProperty(k)) {
					// Skip menu type
					if(k === "__type__") continue;
					
					var child = data[k];
					
					// Sub navigation menu
					if(child && (typeof child === 'object')) {
						
						// Inherit the type from the parent if child object has no type
						if(data["__type__"] && (!child["__type__"])) child["__type__"] = data["__type__"];
						
						// 
						content += "<li class=\""+args.item_class+"\">" + 
						           " <a href=\"" + __escape_xml(__get_link_href(args.path+"/"+k)) + "\"" +
						           " onclick=\"$UI().refresh('" + __escape_xml(args.path+"/"+k) + "')\"" +
						           ">" + __escape_xml(k) + "</a>\n"+
						           get_ul(child, ui, {"path":args.path+"/"+k, 
						                            "class_name":"submain", 
						                            "item_class":"subitem", 
						                           } ) +
						           "</li>\n";
						continue;
					}
					
					// Normal menu item
					var path = ( (typeof data[k]==="string") && (data[k] !== "") ) ? data[k] : args.path+"/"+k;
					content += "<li class=\"item\">" +
					           " <a href=\"" + __escape_xml(__get_link_href(path)) + "\"" +
					           " onclick=\"$UI().refresh('" + __escape_xml(path) + "')\"" +
					           ">" + __escape_xml(k) + "</a></li>\n";
				}
			}
			content += "</ul>";
			return content;
		}
		
		/** Build object as a navigation menu
		 * @param data Object
		 * @returns string HTML code
		 */
		function get_html_object_menu(data, ui) {
			var tmp = "<div class=\"menu\">";
			for(var k in data) if(data.hasOwnProperty(k)) {
				if(k === "__type__") continue;
				tmp += get_ul(data[k], ui, {"path":"/"+k, "class_name":"main", "item_class":"item", "label":k});
			}
			tmp += "</div>";
			tmp += "<div class=\"menu_clear\"></div>";
			return tmp;
		}
		
		/** Build orig structure for form */
		function build_type_obj(data) {
			var obj = {};
			for(var i in data) if(data.hasOwnProperty(i)) {
				if(/^__.+__$/.test(i)) continue;
				obj[i] = data[i];
			}
			return JSON.stringify(obj);
		}
		
		/** Build object as an HTML form 
		 * @param data Object
		 * @returns string HTML code
		 */
		function get_html_object_form(data, ui) {
			var method = data["__method__"];
			var action = data["__action__"];
			var caption = data["__caption__"];
			var object_name = data["__name__"];
			//var data_json = build_type_obj(data);
			
			var submit = {};
			if(data["__submit__"]) submit.name = data["__submit__"];
			if(!submit.name) submit.name = "submit";
			if(!submit.label) submit.label = submit.name;
			
			/*if( (!action) && __preferences.useLegacy) action = __get_link_href();*/
			
			if(!method) method = "post";
			
			var content = "<form";
			if(method) content += " method=\""+__escape_xml(method)+"\"";
			if(action) content += " action=\""+__escape_xml(action)+"\"";
			content += " onsubmit=\"return $UI().submit_form(this)\"";
			content += ">\n";
			if(__preferences.useLegacy) {
				content += "<input type=\"hidden\" name=\"legacy\" value=\"1\" />";
				content += "<input type=\"hidden\" name=\"action\" value=\""+__escape_xml(ui.__current_action)+"\" />";
			}
			content += "<table class=\"form\" border=\"0\" cellspacing=\"0\" cellpadding=\"2\" width=\"100%\">\n";
			if(caption) content += " <caption>" + __escape_xml(caption) + "</caption>\n";
			content += " <tbody>\n";
			for(var k in data) if(data.hasOwnProperty(k)) {
				if(k === "__caption__") continue;
				if(k === "__method__") continue;
				if(k === "__action__") continue;
				if(k === "__type__") continue;
				if(k === "__name__") continue;
				
				var input_name = (object_name) ? object_name+"."+k : k;
				var html = get_html_input(k, data[k], undefined, input_name);
				var html_input = html.shift();
				var html_field = html.shift();
				
				if(html_field) {
					content += " <tr class=\"item\">\n" +
					           "  <th>" + html_field + "</th>\n" +
					           "  <td>" + html_input + "</td>\n" +
					           " </tr>\n";
				} else {
					content += " <tr class=\"item\">\n" +
					           "  <td colspan=\"2\">" + html_input + "</td>\n" +
					           " </tr>\n";
				}
			}
			content += " <tr class=\"buttons\">\n" +
			           "  <th>&nbsp;</th>\n" +
			           "  <td>"+
			           "   <button"+
			           " name=\"" + __escape_xml(submit.name) + "\""+
			           " type=\"submit\""+
			           " class=\"button positive\">"+
			           "<img src=\"lib/blueprint/plugins/buttons/icons/tick.png\" alt=\"\"/> "+
			           __escape_xml(submit.label)
			           "</button>"+
			           "</td>\n" +
			           " </tr>\n";
			content += " </tbody>\n";
			content += "</table>\n";
			content += "</form>\n";
			//content += "<p>" + __escape_xml(caption) + "</p>";
			//content += "<p>" + __escape_xml(content) + "</p>";
			return content;
		}
		
		/* Build array containing objects as a table
		 * @param data Object
		 * @returns string HTML code
		 */
		function get_html_array_table(data, ui) {
			var caption = data["__caption__"];
			
			// Read caption
			for(var i in data) if(data.hasOwnProperty(i)) {
				if( (typeof data[i] === "string") && data[i].substr(0, 12) === "__caption__:" ) {
					caption = data[i].substr(12);
					continue;
				}
				if(data[i] instanceof Object) break;
			}
		
			// Build table code
			var content = "<table class=\"table\" border=\"0\" cellspacing=\"0\" cellpadding=\"2\" width=\"100%\">\n";
			
			if(caption) content += " <caption>" + __escape_xml(caption) + "</caption>\n";
			
			// Build header
			content += " <thead>\n";
			for(var i in data) if(data.hasOwnProperty(i)) {
				if(!(data[i] instanceof Object)) continue;
				content += " <tr>\n";
				for(var k in data[i]) if(data[i].hasOwnProperty(k)) {
					content += "  <th class=\"key\">" + __escape_xml(k) + "</th>\n";
				}
				content += " </tr>\n";
				break;
			}
			content += " </thead>\n";
			
			// Build data rows
			content += " <tbody>\n";
			for(var i in data) if(data.hasOwnProperty(i)) {
				if(!(data[i] instanceof Object)) continue;
				content += " <tr>\n";
				for(var k in data[i]) if(data[i].hasOwnProperty(k)) {
					if(k === "__caption__") continue;
					content += "  <td class=\"value\">" + get_html(data[i][k], ui) + "</td>\n";
				}
				content += " </tr>\n";
			}
			
			content += " </tbody>\n";
			content += "</table>\n";
			//content += "<p>" + __escape_xml(caption) + "</p>";
			//content += "<p>" + __escape_xml(content) + "</p>";
			return content;
		}
		
		/* Build array elements as one
		 * @param data Object
		 * @returns string HTML code
		 */
		function get_html_array(data, ui) {
			var content = "";
			for(var i in data) if(data.hasOwnProperty(i)) {
				content += get_html(data[i], ui);
			}
			return content;
		}
		
		/* Build object as an record table
		 * @param data Object
		 * @returns string HTML code
		 */
		function get_html_object(data, ui) {
			var caption = data["__caption__"];
			var content = "<table class=\"record\" border=\"0\" cellspacing=\"0\" cellpadding=\"2\" width=\"100%\">\n";
			if(caption) content += " <caption>" + __escape_xml(caption) + "</caption>\n";
			content += " <tbody>\n";
			for(var k in data) if(data.hasOwnProperty(k)) {
				if(k === "__caption__") continue;
				
				content += " <tr>\n" +
				           "  <th class=\"key\">" + __escape_xml(k) + "</th>\n" +
				           "  <td class=\"value\">" + get_html(data[k], ui) + "</td>\n" +
				           " </tr>\n";
			}
			content += " </tbody>\n";
			content += "</table>\n";
			//content += "<p>" + __escape_xml(caption) + "</p>";
			//content += "<p>" + __escape_xml(content) + "</p>";
			return content;
		}
		
		/* Build HTML code for data value
		 * @param data Mixed type data value
		 * @returns HTML code as string
		 */
		function get_html(data, ui) {
			if( data && (typeof data === "object") ) {
				if(typeof data.toUIFormat === 'function') return __escape_xml(data.toUIFormat());
				if(data["__type__"] === "menu") return get_html_object_menu(data, ui);
				if(data["__type__"] === "form") return get_html_object_form(data, ui);
				if(isArrayTable(data)) return get_html_array_table(data, ui);
				if(data instanceof Array) return get_html_array(data, ui);
				if(data instanceof UIMessage) return get_html_message(data.type, data.msg);
				return get_html_object(data, ui);
			}
			return __escape_xml(""+data);
		}
		
		this.save( get_html(this.__content, this) );
		return this;
	};
	
	/** Fetch data from remote backend into the ui */
	function __do_remote_request(action, options, ui) {
		try {
			if(!__hasAjax) throw ReferenceError("No Ajax detected");
			
			var params = {
				"type":"json",
				"action":action,
			};
			if(options) params.options = JSON.stringify(options);
			
			//alert("params.options = " + );
			
			ui.content( "Loading... 25%" );
			
			if(!this.__backend) throw new Error("No backend configured!");
			new Ajax.Request(this.__backend,
				{
					method: 'post',
					parameters: params,
					onSuccess: function(transport){
						try {
							ui.content( "Loading... 50%" );
							var response = JSON.parse(transport.responseText || "{}");
							ui.content( "Loading... 75%" );
							ui.content( response );
						} catch(e) {
							ui.content(e);
							throw e;
						}
					},
					onFailure: function(){ 
						ui.content( "Request failed!" );
					},
				});
			
		} catch(e) {
			ui.content(e);
			throw e;
		}
	}
	
	/* Fetch result for action */
	UserInterface.prototype.refresh = function(action, options) {
		var undefined;
		try {
			var ui = this;
			ui.content( "Loading... 0%" );
			
			var action = action;
			if( (action === undefined) && global.location && global.location.hash ) {
				action = (""+global.location.hash).replace(/^#/, "");
			}
			if(action === undefined) action = "index";
			if(typeof action !== 'string') action = ""+action;
			if(action.length === 0) action = "index";
			
			ui.__current_action = action;
			
			__location_hash = "#"+action;
			
			ui.content( "Loading... 10%" );
			
			/* Local action */
			if(action === "/config/client/preferences") {
				
				var changed = false;
				if(options && options.record) {
					$UI("preferences").set(options.record);
					__preferences_changed();
					changed = true;
				}
				
				var form = {
					"__type__":"form",
					"__caption__":"Preferences",
					"__name__":"record",
				};
				for(i in __preferences) if(__preferences.hasOwnProperty(i)) {
					form[i] = __preferences[i];
				}
				if(changed) {
					ui.content( [form, "Settings has been changed."] );
				} else {
					ui.content( form );
				}
				return this;
			}
			
			ui.content( "Loading... 24%" );
			
			(this.__do_request)(action, options, ui);
			
		} catch(e) {
			ui.content(e);
			throw e;
		}
		return this;
	};
	
	/* Submit form */
	UserInterface.prototype.submit_form = function(form) {
		var undefined;
		
	    /** Parse value into object based on keyword */
	    function set_object_keys(obj, full_key, value) {
	        function do_state(obj, keys, value) {
	            var key = keys.shift();
	            if(keys.length !== 0) {
	                if(typeof obj[key] !== "object") obj[key] = {};
	                return do_state(obj[key], keys, value);
	            }
	            obj[key] = value;
	        }
	
	        var keys = full_key.split("\.");
	        do_state(obj, keys, value);
	    }
		
		/* */
		function __set(data, key, value) {
			if(/\./.test(key)) set_object_keys(data, key, value);
			else data[key] = value;
		}
		
		var data = {};
		var elements = form.elements;
		for(var i in elements) if(elements.hasOwnProperty(i)) {
			var item = elements[i];
			
			if(item.type == "checkbox") {
				__set(data, ""+item.name, (item.checked) ? "1" : "0");
				continue;
			}
			
			__set(data, ""+item.name, ""+item.value);
		}
		
		var options = UserInterface.__object_normalize(data.type, data.prev, data.next);
		
		//alert("options.record.date = " + options.record.date + " (" + (typeof options.record.date) + ")");
		
		this.refresh(undefined, options);
		
		return false; // Always fail
	};
	
	/* Cache object for $UI() */
	var $UI_CACHE = {};
	
	/* Main interface to the framework */
	UserInterface["$UI"] = function(resource) {
		var undefined;
		if(resource === undefined) resource = "content";
		else resource = ""+resource;
		if(!$UI_CACHE[resource]) {
			$UI_CACHE[resource] = new UserInterface();
			$UI_CACHE[resource].__do_request = __do_remote_request;
		}
		return $UI_CACHE[resource];
	}
	
	/* */
	function __preferences_changed() {
		for(var i in $UI_CACHE) if($UI_CACHE.hasOwnProperty(i)) {
			$UI_CACHE[i].backend(__get_backend());
		}
	}
	
/* End of private source code */
})(this);

/* EOF */
