ext.panel	=	{
	last_container: null,

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

		if(options.width) container_el.setStyle('width', options.width);
		ext.panel.reset_height(container_el);

		var appclass	=	app[controller];
		if(!appclass)
		{
			console.log('panel: error: class app.'+controller+' not found.');
			return false;
		}
		new appclass(params);
	}
};

comm.bind('resize', function() {
	ext.panel.reset_height();
});
