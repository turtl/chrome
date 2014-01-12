ext.personas	=	{
	generating_key: false,
	notify_rsa_gen: false,

	init: function()
	{
		comm.bind('rsa-keygen-start', function() {
			ext.personas.generating_key	=	true;
		})
		comm.bind('rsa-keygen-finish', function() {
			ext.personas.notify();
			ext.personas.generating_key	=	false;
		});
		comm.bind('rsa-keygen-error', function(err) {
			ext.personas.generating_key	=	false;
			console.log('RSA: error: ', err);
		})
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
	},

	notify: function(rsakey)
	{
		if(ext.personas.notify_rsa_gen)
		{
			chrome.notifications.create('rsa-done', {
				type: 'basic',
				title: 'RSA key generation complete',
				message: 'You can now share with others!',
				iconUrl: chrome.extension.getURL('data/app/images/favicon.128.png')
			}, function() {});
		}
	}
};
