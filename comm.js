var comm	=	new (function() {
	var bindings	=	{};

	var bind	=	function(action, cb)
	{
		if(!bindings[action]) bindings[action] = [];
		if(bindings[action].indexOf(cb) >= 0) return true;
		bindings[action].push(cb);
	};

	var unbind	=	function(action, cb)
	{
		if(!action)
		{
			bindings	=	{};
			return true;
		}

		if(!cb)
		{
			if(bindings[action]) bindings[action] = [];
			return true;
		}

		if(bindings[action])
		{
			var idx	=	bindings[action].indexOf(cb);
			if(idx < 0) return false;

			bindings[action].splice(idx, 1);
			return true;
		}

		return false;
	};

	var trigger	=	function(action)
	{
		var args = Array.prototype.slice.call(arguments, 0)
		args.shift();

		var callbacks	=	bindings[action];
		if(!callbacks || callbacks.length == 0) return true;

		for(var i = 0, n = callbacks.length; i < n; i++)
		{
			var cb	=	callbacks[i];
			cb.apply(this, args);
		}
		return true;
	};

	this.bind		=	bind;
	this.unbind		=	unbind;
	this.trigger	=	trigger;
});

