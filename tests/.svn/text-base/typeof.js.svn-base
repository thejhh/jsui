/* JavaScript function candy test */
Extension.load("system");
var undefined;
var stdout = system.stdout;

stdout.writeln("typeof new Date() = " + typeof new Date());
stdout.writeln("typeof undefined = " + typeof undefined);
stdout.writeln("typeof null = " + typeof null);
stdout.writeln("typeof 1234 = " + typeof 1234);
stdout.writeln("typeof 1234.5678 = " + typeof 1234.5678);
stdout.writeln("typeof [] = " + typeof []);
stdout.writeln("typeof {} = " + typeof {});
stdout.writeln("typeof Object = " + typeof Object);
stdout.writeln("typeof Function = " + typeof Function);

stdout.writeln("[] instanceof Array = " + ([] instanceof Array));

var d = new Date();
stdout.writeln("typeof d == " + (typeof d) );
stdout.writeln("d instanceof Date == " + (d instanceof Date) );
stdout.writeln("d instanceof Object == " + (d instanceof Object) );

function Foo(x) {
	this.value = x;
}

var f = new Foo();
stdout.writeln("f instanceof Foo == " + (f instanceof Foo) );
f.test = "hello";
stdout.writeln("f instanceof Foo == " + (f instanceof Foo) );

/* EOF */
