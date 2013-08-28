var barfr		=	null;
var _base_url	=	null;
var app			=	chrome.extension.getBackgroundPage();

var loading	=	function(yesno)
{
	var yes	=	yesno ? true : false;
	var img	=	document.getElement('img.load');
	if(!img) return false;
	if(yes)	img.setStyle('visibility', 'visible');
	else	img.setStyle('visibility', '');
};

var note	=	function(txt)
{
	barfr.barf(txt);
};

/**
 * called after a successful join, loads the "ADD A PERSONA LOL" dialog into the
 * current login box.
 *
 * NOTE: this duplicates a lot of the code in the menu.js lib, but since it's
 * not loaded yet (and it would be a pain to load it JUST to open the personas)
 * we duplicate. waaahh
 */
var open_personas	=	function()
{
};

var submit_login	=	function(e)
{
	if(e) e.stop();
	var form	=	e.target;

	var username	=	form.getElement('input[name=username]');
	var password	=	form.getElement('input[name=password]');
	var user	=	new app.User({
		username: username.get('value'),
		password: password.get('value')
	});
	var auth	=	user.get_auth();
	var key		=	app.tcrypt.key_to_string(user.get_key());
	if(!auth) return;
	loading(true);
	user.test_auth({
		success: function(id) {
			loading(false);
			var data = user.toJSON();
			data.id = id;
			app.turtl.user.set({
				username: user.get('username'),
				password: user.get('password')
			});
			app.turtl.user.login(data);
			app.turtl.loading(false);
			window.close();
		},
		error: function(err) {
			loading(false);
			note(err);
		}
	});
};

var submit_join	=	function(e)
{
	if(e) e.stop();
	var form	=	e.target;

	var username	=	form.getElement('input[name=username]');
	var password	=	form.getElement('input[name=password]');
	var pconfirm	=	form.getElement('input[name=confirm]');
	var submit		=	form.getElement('input[type=submit]');

	// error check
	if(username.get('value').length < 4)
	{
		note('Your username must have four or more characters.');
		username.focus();
		return false;
	}
	if(password.get('value') != pconfirm.get('value'))
	{
		note('Your password does not match the confirmation.');
		pconfirm.focus();
		return false;
	}
	if(password.get('value').length < 4)
	{
		note('Your password must have four or more characters.');
		password.focus();
		return false;
	}
	if(password.get('value').toLowerCase() == 'password')
	{
		note('No. Bad user. BAD. That is <em>not</em> an acceptable password.');
		password.focus();
		return false;
	}

	submit.disabled	=	true;

	var user	=	new app.User({
		username: username.get('value'),
		password: password.get('value')
	});
	var auth	=	user.get_auth();
	var key		=	app.tcrypt.key_to_string(user.get_key());
	if(!auth) return;
	loading(true);
	user.join({
		success: function(userdata) {
			var data = user.toJSON();
			data.id = userdata.id;
			app.turtl.user.set({
				username: user.get('username'),
				password: user.get('password')
			});
			app.turtl.user.login(data);
			app.turtl.loading(false);

			open_personas();
		}.bind(this),
		error: function(err) {
			loading(false);
			submit.disabled	=	false;
			note(err);
		}
	});
};

window.addEvent('domready', function() {
	barfr	=	new app.Barfr('barfr', {});
	barfr.objects.container.dispose().inject(document.body, 'bottom');

	var container	=	document.getElement('.user-panel');
	container.addEvent('submit:relay(.login form)', submit_login);
	container.addEvent('submit:relay(.join form)', submit_join);

	var login_username	=	document.getElement('.login input[name=username]');
	if(login_username) login_username.focus();
});

