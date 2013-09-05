ext.panel	=	{
	is_open: false,

	last_container: null,
	last_inject: null,
	controller: null,

	reset_height: function(container_el)
	{
		container_el || (container_el = ext.panel.last_container);
		if(!container_el) return false;

		// reset the window height.
		container_el.getParent().setStyle('height', 1);
		(function() {
			container_el.getParent().setStyle('height', '');
		}).delay(10, this);
	},

	open: function(container_el, controller, params, options)
	{
		params || (params = {});
		options || (options = {});

		ext.panel.last_container	=	container_el;
		if(params.inject)
		{
			ext.panel.last_inject	=	params.inject;
		}

		if(options.width) container_el.setStyle('width', options.width);
		ext.panel.reset_height(container_el);

		var appclass	=	app[controller];
		if(!appclass)
		{
			console.log('panel: error: class app.'+controller+' not found.');
			return false;
		}
		ext.panel.controller	=	new appclass(params);

		comm.bind('addon-controller-release', function() {
			comm.unbind_context('panel:controller-release');
			ext.panel.release();
		}, 'panel:controller-release');
		comm.bind('close', function() {
			comm.unbind_context('panel_close');
			// get the current window (async)
			// TODO: make this window-specific somehow (note that all attempts
			// to do this reaonably have failed. windows.getCurrent and 
			// windows.getLastFocused both return a window id that makes the
			// popup search turn up empty).
			var popup	=	chrome.extension.getViews({type: 'popup'})[0];
			if(popup) popup.close();
		}, 'panel:close');
	},

	release: function()
	{
		var controller	=	ext.panel.controller;
		if(controller && controller.release) controller.release();
	},
};

// listen dor connect/disconnect (lets us know when the panel opens/closes).
// note that the content in the panel (user panel/menu) must manually connect to
// the port we open here.
chrome.runtime.onConnect.addListener(function(port) {
	if(port.name != 'panel') return;
	comm.trigger('panel-open');
	ext.panel.is_open	=	true;
	port.onDisconnect.addListener(function() {
		port.onDisconnect.removeListener(arguments.callee);
		ext.panel.is_open	=	false;
		comm.trigger('panel-close');
	});
});

