
Extension.load("./Session.js");
Extension.load("system");

/* Session test */
(function(global) {
	
	var stdout = system.stdout;
	
	var session_dir = new SessionDirectory("./session");
	
	/* Create new session file from scratch */
	var a = session_dir.load();
	a.foo = "bar";
	a.date = new Date();
	a.save();
	system.stdout.writeln("opened "+a+" stored at " + a.getStore() );
	
	/* Load session file based on wrong session ID */
	var b = session_dir.load("qwerty");
	b.foo = "bar";
	b.date = new Date();
	b.save();
	system.stdout.writeln("opened "+b+" stored at " + b.getStore() );
	
	/* Load session file based on a's session_id */
	var c = session_dir.load(a.getSessionID());
	c.foo = "bar";
	c.date = new Date();
	c.bar = "hello";
	c.save();
	system.stdout.writeln("opened "+c+" stored at " + c.getStore() );
	
	

})(this);
/* EOF */
