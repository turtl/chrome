/**
 * This object provides a standard interface for the addon and the app to talk
 * to each other. Although in a chrome addon you can call functions in other
 * parts of the addon directly, since the FF addon isn't set up this way, it's
 * better to just use the same standard interface: message passing. This is more
 * "correct" anyway (just ask the erlang guys, they'll tell you).
 */
var Comm	=	(function() {
	var bindings	=	{};

	/**
	 * Bind a callback (function) to an event (string).
	 */
	var bind	=	function(event, cb)
	{
		// init the bindings for this event, if needed
		if(!bindings[event]) bindings[event] = [];

		// try to prevent double-bindings
		if(bindings[event].indexOf(cb) >= 0) return true;

		// binding doesn't exist! create it
		bindings[event].push(cb);
	};

	/**
	 * Unbind an event/callback pair. If callback isn't given, all events of
	 * type `event` are unbound. If event *and* allback aren't passed then
	 * unbind all bindings (empty slate).
	 */
	var unbind	=	function(event, cb)
	{
		// if event is blank, unbind everything
		if(!event)
		{
			bindings	=	{};
			return true;
		}

		// if callback is blank, unbind all of the given event's bindings
		if(!cb)
		{
			if(bindings[event]) bindings[event] = [];
			return true;
		}

		// remove the event/callback pair (if found)
		if(bindings[event])
		{
			var idx	=	bindings[event].indexOf(cb);
			if(idx < 0) return false;

			bindings[event].splice(idx, 1);
			return true;
		}

		return false;
	};

	/**
	 * Trigger an event (asynchronously), passing all the given arguments (sans
	 * even name) to the callbacks bound to that event type.
	 */
	var trigger	=	function(event, _args)
	{
		// clone the actuments, pop off the event name
		var args = Array.prototype.slice.call(arguments, 0)
		args.shift();

		// send an event ALWAYS triggered on any trigger event
		if(event != 'all') trigger('all', event, args);

		var callbacks	=	bindings[event]
		if(!callbacks || callbacks.length == 0) return true;

		// clone the callbacks (so if they change while firing we don't get
		// weird loop corruptions)
		callbacks	=	callbacks.slice(0);

		// remember, triggers are async
		(function() {
			for(var i = 0, n = callbacks.length; i < n; i++)
			{
				var cb	=	callbacks[i];
				cb.apply(this, args);
			}
		}).delay(0, this);

		return true;
	};

	this.bind		=	bind;
	this.unbind		=	unbind;
	this.trigger	=	trigger;
});

