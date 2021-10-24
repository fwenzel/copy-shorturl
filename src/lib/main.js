import discoverUrl from './discover.js';
import processUrl from './shortener.js';

const _ = browser.i18n.getMessage;

/** Add context menus and toolbar button. */
// per-page
browser.contextMenus.create({
  id: 'shorten-page',
  title: _('menuitem_label'),
  contexts: ['page', 'tab']
});

// per-link
browser.contextMenus.create({
  id: 'shorten-link',
  title: _('shorten_link_label'),
  contexts: ['link']
});

// per-image
browser.contextMenus.create({
  id: 'shorten-img',
  title: _('shorten_img_label'),
  contexts: ['image']
});

// Toolbar button.
browser.browserAction.onClicked.addListener(discoverUrl);


/** Process content menu clicks */
browser.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
  case 'shorten-page':
    discoverUrl();
    break;
  case 'shorten-link':
    processUrl({
      url: info.linkUrl,
      short: false
    });
    break;
  case 'shorten-img':
    processUrl({
      url: info.srcUrl,
      short: false
    });
    break;
  }
});

/** Listen to keyboard shortcut. */
browser.commands.onCommand.addListener((cmd) => {
  if (cmd === 'shorten-page-url') {
    discoverUrl();
  }
});
