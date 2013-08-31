ext.invites	=	{
	invite_valid: function(code, id, success)
	{
		new Request({
			url: config.api_url + '/invites/codes/'+code,
			data: {invite_id: id},
			method: 'get',
			onSuccess: function(res) {
				success(JSON.parse(res));
			}
		}).send();
	},

	process_invite: function(code, id, key)
	{
		ext.invites.invite_valid(code, id, function(invite) {
			// add in the key
			invite.data.key	=	key;

			// add the invite to persistent storage
			var invites				=	JSON.parse(localStorage.invites);
			invites[invite.id]		=	invite;
			localStorage.invites	=	JSON.stringify(invites);

			if(app.turtl.user.logged_in)
			{
				ext.invites.notify();
			}
		});
	},

	have_pending: function()
	{
		return Object.keys(JSON.parse(localStorage.invites) || {}).length > 0;
	},

	init: function()
	{
		if(!localStorage.invites) localStorage.invites = '{}';

		comm.bind('invite-remove', function(invite_id) {
			var invites	=	JSON.parse(localStorage.invites);
			delete invites[invite_id];
			localStorage.invites	=	JSON.stringify(invites);
		});

		// give it a path with some invite data and this splits out the correct
		// values. helper function.
		var process_invite_path	=	function(path)
		{
			var code		=	path.replace(/.*\/invites\/([0-9a-f-]+)\/.*$/, '$1');
			var invite_id	=	path.replace(/.*\/invites\/[0-9a-f-]+\/([0-9a-f-]+)\/.*$/, '$1');
			var key			=	path.replace(/.*\/invites\/[0-9a-f-]+\/[0-9a-f-]+\/([0-9a-f-]+).*?$/, '$1');
			if(	code.match(/^[0-9a-f-]+$/) &&
				invite_id.match(/^[0-9a-f-]+$/) &&
				key.match(/^[0-9a-f-]+$/) )
			{
				ext.invites.process_invite(code, invite_id, key);
			}
		};

		// listen for invite scrapes (from content script defined in manifest)
		chrome.runtime.onMessage.addListener(function(req, sender) {
			if(req.type == 'invite-scrape')
			{
				(function() { process_invite_path(req.data); }).delay(0, this);
			}
		});

		// note only do we look for invites on new tabs, but also loop over all
		// current tabs and find any matching (existing) tabs. this allows a user
		// to install the addon from an invite page and have the addon track the
		// invite instantly.
		chrome.tabs.query({url: '*://turtl.it/invites/*/*/*'}, function(tabs) {
			tabs.each(function(tab) {
				var url		=	tab.url;
				var path	=	url.replace(/^[a-z]+:\/\/[^\/]+/, '');
				process_invite_path(path);
			});
		});
	},

	open: function(container, inject, options)
	{
		options || (options = {});

		ext.panel.open(container, 'InvitesListController', {
			inject: inject
		}, {
			width: 600
		});
		comm.trigger('invites-populate', JSON.parse(localStorage.invites));
	},

	notify: function()
	{
		// this chrome-specific function is used because we can't manually open
		// the invites panel, the user has to do it themselves. sigh.
	}
};

