var app	=	chrome.extension.getBackgroundPage();

var menu	=	{
	get_el: function()
	{
		returnreturn  document.getElement('ul.app-menu');
	},

	close: function()
	{
		window.close();
	},

	show_panel: function()
	{
		var menu_ul	=	menu.get_el();
	},

	dispatch: function(url)
	{
		switch(url)
		{
		case 'bookmark':
			app.bookmark.open();
			break;
		case 'app':
			app.open_app();
			menu.close();
			break;
		case 'personas':
			app.personas.open();
			break;
		case 'invites':
			app.invites.open();
			break;
		case 'logout':
			app.turtlext.do_logout();
			menu.close();
			break;
		case 'about':
			app.about.open();
			break;
		}
	}
};

window.addEvent('domready', function() {
	var menu_ul	=	menu.get_el();
	if(!menu_ul) return false;

	menu_ul.addEvent('click:relay(a)', function(e) {
		if(e) e.stop();
		if(!e.target) return false;
		var href	=	e.target.href.replace(/^.*#/, '');
		menu.dispatch(href);
	});
});
