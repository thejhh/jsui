/* JavaScript regexp test */
Extension.load("system");

/*
function f(value) {
	var undefined,
	    regxp = /^([A-Za-z0-9_\.]+)\((.*)\)$/ig;
	var matches = regxp.exec(""+value);
	if(matches && (matches[1]!==undefined) && (matches[2]!==undefined)) return [matches[1], matches[2]];
	else throw new TypeError("illegal input: "+value);
}
*/

function f(value) {
	var value = ""+value;
	var items = value.split("(");
	if(items.length < 2) throw new TypeError("illegal input: "+value);
	var name = items.shift();
	var data = items.join("(");
	if(data.charAt(data.length-1) != ')') throw new TypeError("illegal input: "+value);
	return [name, data.substr(0, data.length-1)];
}

system.stdout.writeln( "Result: " + f("String()") );
system.stdout.writeln( "Result: " + f("String(1234)") );
system.stdout.writeln( "Result: " + f("String(Abcdefgh)") );
system.stdout.writeln( "Result: " + f("String()(Abcdefgh)") );
system.stdout.writeln( "Result: " + f("String/()(Abcdefgh)") );

/* EOF */
