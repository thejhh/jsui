/* JavaScript User Interface Library -- Common datatypes for user elements
 * Copyright 2010 Jaakko-Heikki Heusala <jhh@jhh.me>
 * $Id: common.js 415 2010-10-15 05:00:51Z jheusala $
 */

/** Simple message box constructor
 * @params type The message type: error, notice, info or success
 * @params msg Message
 */
function UIMessage(type, msg) {
	var undefined;
	if(this instanceof arguments.callee) {
		if(type === undefined) throw TypeError("type undefined");
		if(msg === undefined) {
			msg = type;
			type = undefined;
		}
		this.type = type || "info";
		this.msg = ""+msg;
	} else {
		return new UIMessage(type, msg);
	}
}

/** Get the message as a string */
UIMessage.prototype.toString = function() {
	return this.type + ": " + this.msg;
}

/** Convert to JSON using JSONObject extension */
UIMessage.prototype.toJSON = function() {
	return new JSONObject("UIMessage", this.type + ":" + this.msg );
};

/* Setup reviver for JSONObject */
JSONObject.revivers.UIMessage = function(value) {
	var parts = (""+value).split(":");
	return new UIMessage(parts.shift(), parts.join(":"));
};

/* EOF */
