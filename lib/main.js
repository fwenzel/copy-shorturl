const _ = require('sdk/l10n').get,
      clipboard = require('sdk/clipboard'),
      contextMenu = require('sdk/context-menu'),
      data = require('sdk/self').data,
      notify = require('./simple-notify').notify,
      prefs = require('sdk/simple-prefs').prefs,
      xhr = require('sdk/net/xhr'),
      tabs = require('sdk/tabs'),
      // Deprecated
      aboutconfig = require('sdk/preferences/service');

const { Hotkey } = require('sdk/hotkeys');


// about:config preferences, deprecated
const serviceurl_pref = 'extensions.copyshorturl.serviceURL';

// Service defaults.
const default_service = 'isgd',
      serviceurl_docs = 'http://copy-shorturl.readthedocs.org/en/latest/serviceurl.html';

// Specify 'url' for plain-text GET APIs, or request/result for more complex
// variants.
var serviceurls = {
  isgd: {
    url: 'http://is.gd/api.php?longurl=%URL%'
  },
  tinyurl: {
    url: 'http://tinyurl.com/api-create.php?url=%URL%'
  },
  googl: {
    // https://developers.google.com/url-shortener/v1/getting_started
    request: function(url) {
      let req = new xhr.XMLHttpRequest();
      req.open('POST', 'https://www.googleapis.com/urlshortener/v1/url', false);
      req.setRequestHeader('Content-Type', 'application/json');
      req.send(JSON.stringify({ longUrl: url }));
      return req;
    },
    result: function(req) {
      let shortened = JSON.parse(req.responseText);
      return shortened.id;
    }
  }
};
// Hook up pref button to service URL docs.
require('sdk/simple-prefs').on('serviceurl_docs', function() {
  require('sdk/tabs').open(serviceurl_docs);
});


/** Determine service URL */
function getShorteningService() {
  if (prefs.service === 'custom') {
    if (prefs.customurl) {
      return {
        url: prefs.customurl
      };
    } else {
      // Restore default.
      prefs.service = default_service;
    }
  }
  return serviceurls[prefs.service];
}


/** Create a short URL from is.gd, tinyurl, etc. */
function createShortUrl(url) {
    let req,
        service = getShorteningService();

    try {
      if (service.request) {
        req = service.request(url);
      } else {
        req = new xhr.XMLHttpRequest();
        let _uri = service.url.replace('%URL%', encodeURIComponent(url));
        req.open('GET', _uri, false);
        req.send(null);
      }
      if (req.status === 200) {
          let result = service.result ? service.result(req) : req.responseText.trim();
          notify(_('none_found_notice') + '\n' + url + ' --> ' + result);
          return result;
      } else {
        throw new Error(_('shorten_error'));
      }
    } catch (e) {
      notify(e.message);
      return false;
    }
}


exports.main = function(options, callbacks) {
    /* Set URL from preference if set in old version of add-on. */
    if (aboutconfig.has(serviceurl_pref)) {
      prefs.service = 'custom';
      prefs.customurl = aboutconfig.get(serviceurl_pref);
      aboutconfig.reset(serviceurl_pref);
    }

    /* Add and hook up context menu */
    var item = contextMenu.Item({
        label: _('menuitem_label'),
        contentScriptFile: data.url('js/find-short-url.js'),
        onMessage: function(found_url) {
            let url = found_url['url'];

            if (found_url['short']) {
                notify(_('found_notice') + "\n" + url);
            } else {
                url = createShortUrl(url);
            }

            if (url) clipboard.set(url);
        }
    });

    Hotkey({
        combo: 'accel-shift-l',
        onPress: function() {
            let shortened = createShortUrl(tabs.activeTab.url);
            if (shortened) clipboard.set(shortened);
        }
    });
}
