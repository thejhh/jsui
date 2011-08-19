/* JavaScript left hand operator test. 
 * Sadly, doesn't work as one could expect. */

Extension.load("system");

var foo, bar = ["foo", "bar"];
system.stdout.writeln("foo = " + foo);
system.stdout.writeln("bar = " + bar);

var foo, bar;
[foo, bar] = ["foo", "bar"];
system.stdout.writeln("foo = " + foo);
system.stdout.writeln("bar = " + bar);

/* EOF */
