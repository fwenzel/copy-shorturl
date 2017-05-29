import processUrl from './shortener';

const _ = browser.i18n.getMessage;


/** Add context menus */
browser.contextMenus.create({
  id: 'shorten-page',
  title: _('menuitem_label'),
  contexts: ['page']
});

/** Process content menu clicks */
browser.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case 'shorten-page':
      browser.tabs.executeScript({
        file: '/data/js/find-short-url.js',
        matchAboutBlank: true
      });
      break;
  }
});

/** Handle incoming short URLs. */
browser.runtime.onMessage.addListener(processUrl);
