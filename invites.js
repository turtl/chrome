/**
 * TODO: wrap localStorage BS
 */
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

	num_pending: function()
	{
		return Object.keys(JSON.parse(localStorage.invites) || {}).length;
	},

	have_pending: function()
	{
		return ext.invites.num_pending() > 0;
	},

	init: function()
	{
		if(!localStorage.invites) localStorage.invites = '{}';

		comm.bind('invite-remove', function(invite_id) {
			var invites	=	JSON.parse(localStorage.invites);
			delete invites[invite_id];
			localStorage.invites	=	JSON.stringify(invites);
			comm.trigger('invites-change');
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
		chrome.notifications.clear('invites', function() {});
	},

	notify: function()
	{
		comm.trigger('invites-change');
		if(!ext.invites.have_pending() && !ext.messages.have_pending()) return false;
		if(app.turtl.user.get('personas').models().length == 0) return false;

		chrome.notifications.create('invites', {
			type: 'image',
			title: 'You have pending invites',
			message: 'Open the `Invites` dialog in the Turtl menu to start sharing.',
			iconUrl: chrome.extension.getURL('data/app/favicon_large.png'),
			imageUrl: chrome.extension.getURL('data/invites-open.png')
		}, function() {});
	},

	/**
	 * per-invite notifications. has accept/deny buttons for invites that don't
	 * use a shared secret.
	 */
	notify_individual: function()
	{
		if(app.turtl.user.get('personas').models().length == 0) return false;

		var invites	=	JSON.parse(localStorage.invites);
		Object.each(invites, function(invite) {
			var type	=	'basic';
			var title	=	invite.type == 'b' ? 'Board' : 'Other';
			title		+=	' invite '+ invite.code + ' from '+ invite.from;
			var message	=	'';
			var image	=	null;
			if(invite.data.used_secret)
			{
				type	=	image;
				image	=	chrome.extension.getURL('data/invites-open.png');
				message	=	'This invite is locked with a shared secret. Open the `Invites` menu item to accept.';
			}
			else
			{
				var buttons	=	[
					{title: 'Accept', iconUrl: chrome.extension.getURL('data/app/images/site/icons/check_16x16.png')},
					{title: 'Deny', iconUrl: chrome.extension.getURL('data/app/images/site/icons/x_16x16.png')}
				];
			}
			chrome.notifications.create('invite:'+invite.id, {
				type: type,
				title: title,
				iconUrl: chrome.extension.getURL('data/app/favicon_large.png'),
				message: message,
				imageUrl: image,
				buttons: buttons
			}, function() {});
		});

		// bind to our invite accept/deny buttons
		chrome.notifications.onButtonClicked.addListener(function(nid, bidx) {
			if(!nid.match(/^invite:/)) return false;
			var invite_id	=	nid.replace(/^invite:/, '');
			var accept		=	(bidx == 0);
			chrome.notifications.clear(nid, function() {});
			var invites	=	JSON.parse(localStorage.invites);
			var invite	=	new app.Invite(invites[invite_id]);
			delete invites[invite_id];
			//localStorage.invites	=	JSON.stringify(invites);

			// create a invites controller so we don't duplicate a bunch of code
			// doing accepts/denies
			var invite_controller	=	new app.InvitesListController({
				inject: new app.Element('div')
			});
			invite_controller.collection.add(invite);

			// wrap our action in a fake event object
			var ev	=	{
				stop: function() {},
				target: {
					className: 'invite_'+invite_id,
					get: function() { return 'li'; }
				}
			};

			if(accept)
			{
				invite_controller.accept_invite(ev);
			}
			else
			{
				invite_controller.deny_invite(ev);
			}
		});
	}
};

