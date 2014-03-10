ext.personas	=	{
	init: function()
	{
	},

	open: function(container, inject, options)
	{
		options || (options = {});

		var controller	=	options.add ? 'PersonaEditController' : 'PersonasController';

		ext.panel.open(container, controller, {
			edit_in_modal: false,
			inject: inject,
			join: options.join
		}, {
			width: 750
		});
	}
};
