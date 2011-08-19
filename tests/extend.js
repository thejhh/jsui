/* JavaScript function candy test */

/* Parent object constructor */
function Foo(x) {
	// Make calling "Foo(x)" same as "new Foo(x)"
	if(!(this instanceof arguments.callee)) return new (arguments.callee)(x);
	
	// Setup your members
	this.value = x;
}

/* Child object constructor */
function Bar(x) {
	// Make calling "Bar(x)" same as "new Bar(x)"
	if(!(this instanceof arguments.callee)) return new (arguments.callee)(x);
	
	// Call Foo's constructor
	Foo.apply(this, [x]);
	
	// Setup your members
	this.bar = true;
}

// Make Bar as an alias for Foo. Note: if you touch Bar's prototype after this, it will also change Foo's prototype!
Bar.prototype = Foo.prototype;

/* Test the code */
Extension.load("system");
var undefined;
var stdout = system.stdout;

var b = Bar(true);
stdout.writeln("b instanceof Foo == " + (b instanceof Foo) );
stdout.writeln("b instanceof Bar == " + (b instanceof Bar) );
stdout.writeln("Foo.prototype == " + Foo.prototype );
stdout.writeln("Bar.prototype == " + Bar.prototype );
stdout.writeln("b.value == " + b.value );
stdout.writeln("b.bar == " + b.bar );

/* EOF */
