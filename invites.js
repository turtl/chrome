ext.invites	=	{
	invites: [],

	init: function()
	{
		// populate inivtes from local storage
		if(localStorage.invites) ext.invites.invites = localStorage.invites;

		// TODO: create content script
		// TODO: search open tabs
	},

	open: function(container, inject, options)
	{
		options || (options = {});

		ext.panel.open(container, 'InvitesListController', {
			inject: inject
		}, {
			width: 600
		});
		comm.trigger('invites-populate', ext.invites.invites);
	}
};

ext.invites.init();
