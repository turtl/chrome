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
		comm.bind('rsa-keypair', function(jsonkey) {
			ext.personas.push_key(jsonkey);
		});
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
				iconUrl: chrome.extension.getURL('data/app/favicon.128.png')
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
				comm.trigger('rsa-keypair', jsonkey);
			},
			error: function(err) {
				// shit shit shit
				ext.personas.generating_key	=	false;
			}
		});
	},

	attach_rsa_key_to_persona: function(persona_data)
	{
		var do_add_key	=	function(rsakey)
		{
			comm.trigger('persona-attach-key', rsakey, persona_data);
		};

		// get a key from the RSA lib. if one isn't available, wait until one is
		// and then stop listening and call do_add_key
		var rsakey		=	ext.personas.pop_key();
		if(rsakey)
		{
			// yess!! first try!
			do_add_key(rsakey);
		}
		else
		{
			// if we aren't generating a key, do it since we need one
			if(!ext.personas.generating_key) ext.personas.generate_rsa_key();
			comm.bind('rsa-key', function() {
				// try to grab a new key
				var rsakey	=	ext.personas.pop_key();

				// nope, didn't get a key this time (someone might have been
				// ahead of us in line)
				if(!rsakey)
				{
					if(!ext.personas.generating_key) ext.personas.generate_rsa_key();
					return false;
				}

				// got a key! stop listening for new keys and finish up
				comm.unbind('rsa-key', arguments.callee);
				do_add_key(rsakey);
			});
		}
	}
};
