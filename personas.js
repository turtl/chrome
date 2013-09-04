ext.personas	=	{
	generating_key: false,
	notify_rsa_gen: false,

	init: function()
	{
		if(!localStorage.rsa_keys) localStorage.rsa_keys = '[]';
		var keys	=	JSON.parse(localStorage.rsa_keys);
		if(keys.length == 0 && ext.load_reason == 'install')
		{
			ext.personas.generate_rsa_key();
		}
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

	push_key: function(rsakey)
	{
		var keys	=	JSON.parse(localStorage.rsa_keys);
		keys.push(rsakey);
		localStorage.rsa_keys	=	JSON.stringify(keys);
		comm.trigger('rsa-key');
		console.log('rsa: push key');
		if(ext.personas.notify_rsa_gen)
		{
			chrome.notifications.create('rsa-done', {
				type: 'basic',
				title: 'RSA key generation complete',
				message: 'You can now share with others!',
				iconUrl: chrome.extension.getURL('data/app/favicon_large.png')
			}, function() {});
		}
	},

	pop_key: function()
	{
		var keys	=	JSON.parse(localStorage.rsa_keys);
		if(keys.length == 0) return false;

		var key		=	keys.shift();
		localStorage.rsa_keys	=	JSON.stringify(keys);
		//if(keys.length == 0) ext.personas.generate_rsa_key();
		console.log('rsa: pop key');
		comm.trigger('rsa-pop');
		return key;
	},

	generate_rsa_key: function()
	{
		console.log('rsa: gen key');
		comm.trigger('rsa-gen');
		ext.personas.generating_key	=	true;
		app.tcrypt.generate_rsa_keypair({
			success: function(rsakey) {
				ext.personas.generating_key	=	false;
				var jsonkey	=	app.tcrypt.rsa_key_to_json(rsakey);
				ext.personas.push_key(jsonkey);
			},
			error: function(err) {
				// shit shit shit
				ext.personas.generating_key	=	false;
			}
		});
	},

	attach_rsa_key_to_persona: function(personadata)
	{
		var rsakey		=	ext.personas.pop_key();
		var finishfn	=	function(rsakey)
		{
			var persona	=	app.turtl.user.get('personas').find_by_id(personadata.id);
			if(!persona)
			{
				ext.personas.push_key(rsakey);
				return false;
			}
			persona.set_rsa(app.tcrypt.rsa_key_from_json(rsakey));
			persona.save();
		};

		if(!rsakey)
		{
			// if we aren't generating a key, do it since we need one
			if(!ext.personas.generating_key) ext.personas.generate_rsa_key();
			comm.bind('rsa-key', function() {
				var rsakey	=	ext.personas.pop_key();
				if(!rsakey)
				{
					if(!ext.personas.generating_key) ext.personas.generate_rsa_key();
					return false;
				}
				comm.unbind('rsa-key', arguments.callee);
				finishfn(rsakey);
			});
		}
		else
		{
			finishfn(rsakey);
		}
	}
};
