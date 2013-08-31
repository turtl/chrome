ext.bookmark	=	{
	get_content_type: function(url, finishcb)
	{
		var xhr	=	new XMLHttpRequest();
		xhr.open('GET', url, true);
		xhr.onreadystatechange	=	function()
		{
			if(xhr.readyState == 4)
			{
				var content_type = xhr.getResponseHeader('Content-Type');
				finishcb(content_type);
			}
		}
		xhr.send();
	},

	open: function(container, inject, options)
	{
		options || (options = {});

		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			var tab		=	tabs[0];
			var type	=	'';

			var do_open	=	function(tabdata)
			{
				var text	=	'';
				if(tabdata.image && tabdata.image != '')
				{
					text	+=	'![image]('+tabdata.image+')  \n';
				}
				if(tabdata.desc) text += tabdata.desc;
				var linkdata	=	{
					title: type == 'image' ? '' : tab.title,
					url: tab.url,
					type: type,
					text: text
				};

				ext.panel.open(container, 'BookmarkController', {
					inject: inject,
					linkdata: linkdata
				}, {
					width: 750
				});
			};

			ext.bookmark.get_content_type(tab.url, function(content_type) {
				type	=	content_type.match(/^image/) ? 'image' : 'link';
				if(type == 'image')
				{
					do_open({});
				}
				else
				{
					chrome.runtime.onMessage.addListener(function(req, sender) {
						if(req.type == 'bookmark-scrape')
						{
							(function() { do_open(req.data); }).delay(0, this);
							chrome.runtime.onMessage.removeListener(arguments.callee);
						}
					});
					chrome.tabs.executeScript(null, {file: 'data/bookmark.scrape.js'});
				}
			});
		});
	}
};

