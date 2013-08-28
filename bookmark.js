ext.bookmark	=	{
	open: function(container, inject, options)
	{
		options || (options = {});

		ext.panel.open(container, 'BookmarkController', {
			inject: inject
		}, {
			width: 750
		});
	}
};

