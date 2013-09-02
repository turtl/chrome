// note that we're already in the background page scope here, but I'd like to
// not rely on that fact
var app			=	chrome.extension.getBackgroundPage();
var comm		=	new Comm();
var just_joined	=	false;	// used to track joins (data/user.js)

/**
 * This is the main extension object. Not only does it hold a number of function
 * and data to make the addon work, it's also the scope the other pieces of the
 * addon load themselves into. This gives the extension a single namespace for
 * all its libraries.
 */
var ext	=	{
	// tracks all open Turtl tabs
	app_tabs: [],

	/**
	 * Called on extension init. Initializes any listeners for the "clean slate"
	 * addon state.
	 */
	setup: function()
	{
		ext.invites.init();
		app.turtl.user.bind('login', function() {
			ext.do_login({join: just_joined});
			just_joined	=	false;
		});
		app.turtl.user.bind('logout', ext.do_logout);
		comm.bind('personas-add-open', function() {
			var container	=	ext.panel.last_container;
			var inject		=	ext.panel.last_inject;
			ext.panel.release();
			ext.personas.open(container, inject, {add: true});
		});
		comm.bind('resize', function() {
			// when we get a resize event from a panel controller, tell the
			// panel to resize
			ext.panel.reset_height();
		});
		comm.bind('panel-close', function() {
			// when the main panel (ext popup) closes, release the controller
			// loaded in the panel (if one exists)
			ext.panel.release();
		});
	},

	/**
	 * Called when we wish to open the Turtl app in a tab. If turtl already
	 * exists in a tab in this window, we activate that tab (instead of opening
	 * a new one). IF there's no Turtl app tab opened in this window, we open
	 * one and set up event handling for it.
	 */
	open_app: function()
	{
		// get the current window (async)
		chrome.windows.getLastFocused(function(win) {
			// check if this window has an app tab already
			var window_id	=	win.id;
			for(var i = 0, n = ext.app_tabs.length; i < n; i++)
			{
				var tab	=	ext.app_tabs[i];
				if(tab.windowId == window_id)
				{
					// yes, we have an app tab, activate it and return
					chrome.tabs.update(tab.id, {selected: true});
					return true;
				}
			}

			// no app tab for this window! create one.
			chrome.tabs.create({
				url: chrome.extension.getURL('/data/index.html'),
			}, function(tab) {
				// set up a PERSONALIZED comm for this tab, allowing it to pass
				// its own events around without muddying up our global comm
				// object
				tab.comm	=	new Comm();
				ext.setup_tab(tab.comm);

				// track the tab/window pair
				ext.app_tabs.push(tab);

				// make sure the app tab uses this tab's specific comm object
				(function() {
					var tab_window	=	chrome.extension.getViews({type: 'tab', windowId: window_id})[0];
					if(tab_window) tab_window._comm = tab.comm;
				}).delay(0, this);
			});
		});
	},

	close_app_tab: function(tab_id)
	{
		ext.app_tabs	=	ext.app_tabs.filter(function(tab) {
			// if the tab is being removed, unbind its comm object
			if(tab.id == tab_id) tab.comm.unbind();
			return !(tab.id == tab_id);
		});
	},

	/**
	 * Set up event listening/forwarding for a newly opened app tab. Mainly what
	 * we do here is wire up events between the new tab's port (tabcomm) and the
	 * global/background port (comm).
	 */
	setup_tab: function(tabcomm)
	{
		// forward some background comm events to this tab's comm
		comm.bind('profile-mod', function() { tabcomm.trigger('profile-mod'); });
		comm.bind('profile-sync', function() {
			var args	=	Array.prototype.slice.call(arguments, 0)
			args		=	['profile-sync'].concat(args);
			tabcomm.trigger.apply(tabcomm, args);
		});

		tabcomm.bind('profile-mod', function() {
			// the profile was modified by hand (`profile-mod` does its
			// best to only be called via user-initiated action, not
			// syncing), so signal the background app to do a sync
			// (which should propagate through the rest of the pieces of
			// the addon)
			comm.trigger('do-sync');
		});
		tabcomm.bind('personas-add-open', function() { comm.trigger('personas-add-open'); });
	},

	/**
	 * Set a loading gif icon into the browser action icon. Doesn't work because
	 * the chrome devs don't want to support gif icons. Fair enough.
	 */
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

	/**
	 * Called when a user logs in (via the ext login popup).
	 */
	do_login: function(options)
	{
		options || (options = {});

		ext.loading(true);
		chrome.browserAction.disable();
		comm.bind('profile-load-complete', function() {
			ext.loading(false);
			comm.unbind('profile-load-complete', arguments.callee);
			chrome.browserAction.enable();
			chrome.browserAction.setPopup({popup: '/data/menu.html'});

			if(options.join)
			{
				// if we're here, the personas dialog is already showing. wait
				// for it to close then show the invites notification
			}
			else if(ext.invites.have_pending())
			{
				ext.invites.notify();
			}
		});
	},

	/**
	 * Called when a user logs out of Turtl
	 */
	do_logout: function(options)
	{
		options || (options = {});

		// remove all events everywhere
		if(!options.skip_unbind) comm.unbind();

		// close all app tabs
		chrome.tabs.remove(ext.app_tabs.map(function(tab) { return tab.id; }));

		chrome.browserAction.setPopup({popup: '/data/user.html'});
		chrome.browserAction.setIcon({
			path: '/data/app/favicon_gray.png'
		});

		// run setup again
		if(!options.skip_setup) ext.setup();
	}

	// NOTE: other libs (bookmark, personas, etc) will add their own objects
	// into the `ext` namespace
};

// listen for tab closes and update our app tab list as needed
chrome.tabs.onRemoved.addListener(function(tab_id, info) {
	ext.close_app_tab(tab_id);
});

// set up the app once all the background stuff is done loading
comm.bind('loaded', function() {
	ext.setup();
});

// this sets up the main menu
ext.do_logout({skip_setup: true, skip_unbind: true});

