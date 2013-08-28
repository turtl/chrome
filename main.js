var app		=	chrome.extension.getBackgroundPage();

var turtlext	=	{
	do_login: function()
	{
		chrome.browserAction.setPopup({popup: '/data/menu/main.html'});
		chrome.browserAction.setIcon({
			path: '/data/app/favicon.png'
		});
	},

	do_logout: function()
	{
		chrome.browserAction.setPopup({popup: '/data/user.html'});
		chrome.browserAction.setIcon({
			path: '/data/app/favicon_gray.png'
		});
	}
};

comm.bind('loaded', function() {
	app.turtl.user.bind('login', turtlext.do_login);
	app.turtl.user.bind('logout', turtlext.do_logout);
});

turtlext.do_logout();
turtlext.do_login();

