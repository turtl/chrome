var app		=	chrome.extension.getBackgroundPage();

var ext	=	{
	app_tabs: [],

	open_app: function()
	{
		chrome.windows.getLastFocused(function(win) {
			for(var i = 0, n = ext.app_tabs.length; i < n; i++)
			{
				var tab	=	ext.app_tabs[i];
				if(tab.windowId == win.id)
				{
					chrome.tabs.update(tab.id, {selected: true});
					return true;
				}
			}
			chrome.tabs.create({
				url: chrome.extension.getURL('/data/index.html'),
			}, function(tab) {
				ext.app_tabs.push(tab);
			});
		});
	},

	loading: function(yesno)
	{
		yesno || (yesno = false);
		if(yesno)
		{
			chrome.browserAction.setIcon({
				path: '/data/app/images/site/icons/load_16x16.gif'
			});
		}
		else
		{
			chrome.browserAction.setIcon({
				path: '/data/app/favicon.png'
			});
		}
	},

	do_login: function()
	{
		ext.loading(true);
		chrome.browserAction.disable();
		comm.bind('profile-load-complete', function() {
			ext.loading(false);
			chrome.browserAction.enable();
			comm.unbind('profile-load-complete', arguments.callee);
			chrome.browserAction.setPopup({popup: '/data/menu.html'});
		});
	},

	do_logout: function()
	{
		// close all app tabs
		chrome.tabs.remove(ext.app_tabs.map(function(tab) { return tab.id; }));

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

// listen for tab closes and update our app tab list as needed
chrome.tabs.onRemoved.addListener(function(tab_id, info) {
	ext.app_tabs	=	ext.app_tabs.filter(function(tab) {
		return !(tab.id == tab_id || info.windowId == tab.windowId);
	});
});

ext.do_logout();

