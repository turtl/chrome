var app	=	chrome.extension.getBackgroundPage();

var menu	=	{
	get_el: function()
	{
		return document.getElement('ul.app-menu');
	},

	close: function()
	{
		window.close();
	},

	reset_height: function()
	{
		// reset the box height
		document.body.getParent().setStyle('height', 1);
		(function() {
			document.body.getParent().setStyle('height', '');
		}).delay(10, this);
	},

	show_panel: function(options)
	{
		options || (options = {});

		var menu_ul	=	menu.get_el();
		var wrapper	=	$('wrap-modal');
		if(menu_ul) menu_ul.setStyle('display', 'none');
		if(wrapper) wrapper.setStyle('display', 'block');

		if(options.width) document.body.setStyle('width', options.width);

		menu.reset_height();
	},

	show_menu: function()
	{
		var menu_ul	=	menu.get_el();
		var wrapper	=	$('wrap-modal');
		if(menu_ul) menu_ul.setStyle('display', '');
		if(wrapper) wrapper.setStyle('display', '');

		document.body.setStyle('width', '');

		menu.reset_height();
	},

	dispatch: function(url)
	{
		var bg_inject	=	$('background_content');
		var body		=	document.body;
		switch(url)
		{
		case 'bookmark':
			menu.show_panel();
			app.ext.bookmark.open(body, bg_inject);
			break;
		case 'app':
			app.ext.open_app();
			menu.close();
			break;
		case 'personas':
			menu.show_panel();
			app.ext.personas.open(body, bg_inject);
			break;
		case 'invites':
			menu.show_panel();
			app.ext.invites.open(body, bg_inject);
			break;
		case 'logout':
			app.turtl.user.logout();
			menu.close();
			break;
		}
	}
};

window.addEvent('domready', function() {
	var menu_ul	=	menu.get_el();
	if(!menu_ul) return false;

	// bind our menu items to the dispatch function LOLOLOL
	menu_ul.addEvent('click:relay(a)', function(e) {
		if(e) e.stop();
		if(!e.target) return false;
		var href	=	e.target.href.replace(/^.*#/, '');
		menu.dispatch(href);
	});

	// make sure menu is the right size on load
	menu.reset_height();

	// resize the panel when a main page controller is released
	app.turtl.controllers.pages.bind('release-current', function() {
		menu.show_pane();
	});
});

