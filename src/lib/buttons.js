const _ = require('sdk/l10n').get;
const contextMenu = require('sdk/context-menu');
const data = require('sdk/self').data;
const simpleprefs = require('sdk/simple-prefs');
const tabs = require('sdk/tabs');

const { ActionButton } = require('sdk/ui/button/action');
const { Hotkey } = require('sdk/hotkeys');

const shortener = require('./shortener');

var toolbarButton;


/** Show toolbar button. */
function addToolbarButton() {
  toolbarButton = ActionButton({
    id: 'copy-shorturl-button',
    label: 'Copy ShortURL',
    icon: {
      '16': data.url('img/icon-16.png'),
      '32': data.url('img/icon-32.png'),
      '64': data.url('img/icon-64.png'),
    },
    onClick: buttonAction
  });
}


/** Attach URL detection script to current tab: for hotkey and action button. */
function buttonAction() {
  let worker = tabs.activeTab.attach({
    contentScriptFile: data.url('js/find-short-url.js'),
    onMessage: shortener.processUrl
  });
  worker.port.emit('detect');
}


exports.init = function() {
  // Enable context menu on all pages
  contextMenu.Item({
    label: _('menuitem_label'),
    image: data.url('img/icon-32.png'),
    context: contextMenu.PageContext(),
    contentScriptFile: data.url('js/find-short-url.js'),
    onMessage: shortener.processUrl
  });

  // Additional context menu on <a> tags.
  contextMenu.Item({
    label: _('shorten_link_label'),
    image: data.url('img/icon-32.png'),
    context: contextMenu.SelectorContext('a[href]'),
    contentScriptFile: data.url('js/shorten-link-href.js'),
    onMessage: shortener.processUrl
  });

  // Hotkey for the same functionality.
  Hotkey({
    combo: 'accel-shift-l',
    onPress: buttonAction
  });

  // Toolbar button if enabled.
  if (simpleprefs.prefs.toolbar_button) {
    addToolbarButton();
  }

  // Add/remove toolbar button on pref change.
  simpleprefs.on('toolbar_button', function() {
    if (!simpleprefs.prefs.toolbar_button) {
      toolbarButton.destroy();
      toolbarButton = null;
    } else if (!toolbarButton) {
      addToolbarButton();
    }
  })
};
