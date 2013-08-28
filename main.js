var app		=	chrome.extension.getBackgroundPage();

var ext	=	{
	open_app: function()
	{
		// TODO: open tab into turtl
	},

	do_login: function()
	{
		chrome.browserAction.disable();
		chrome.browserAction.setIcon({
			path: '/data/app/images/site/icons/load_16x16.gif'
		});
		comm.bind('profile-load-complete', function() {
			chrome.browserAction.enable();
			comm.unbind('profile-load-complete', arguments.callee);
			chrome.browserAction.setIcon({
				path: '/data/app/favicon.png'
			});
			chrome.browserAction.setPopup({popup: '/data/menu.html'});
		});
	},

	do_logout: function()
	{
		chrome.browserAction.setPopup({popup: '/data/user.html'});
		chrome.browserAction.setIcon({
			path: '/data/app/favicon_gray.png'
		});
	}

	// NOTE: other libs (bookmark, personas, etc) will add their own objects
	// into the `ext` namespace
};

comm.bind('loaded', function() {
	app.turtl.user.bind('login', ext.do_login);
	app.turtl.user.bind('logout', ext.do_logout);
});

ext.do_logout();

