import processUrl from './shortener';

const _ = browser.i18n.getMessage;


/** Add context menus */
// per-page
browser.contextMenus.create({
  id: 'shorten-page',
  title: _('menuitem_label'),
  contexts: ['page']
});

// per-link
browser.contextMenus.create({
  id: 'shorten-link',
  title: _('shorten_link_label'),
  contexts: ['link']
});


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
  }
});

/** Listen to keyboard shortcut. */
browser.commands.onCommand.addListener((cmd) => {
  if (cmd === 'shorten-page-url') {
    discoverUrl();
  }
});

/**
 * Execute content script to discover canonical short URL on current tab,
 * then listen to it being returned via message.
 */
function discoverUrl() {
  browser.tabs.executeScript({
    file: '/data/js/find-short-url.js'
  });
}
browser.runtime.onMessage.addListener(processUrl);
