ext.messages	=	{
	init: function()
	{
		comm.bind('num-messages', function() {
			comm.trigger('invites-change');
		});
	},

	num_pending: function()
	{
		var messages	=	app.turtl.messages;
		if(!messages) return 0;
		return app.turtl.messages.models().length;
	},

	have_pending: function()
	{
		return ext.messages.num_pending() > 0;
	}
}
