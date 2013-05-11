const clipboard = require('clipboard'),
      contextMenu = require('context-menu'),
      data = require('self').data,
      notify = require('simple-notify').notify,
      prefs = require('sdk/simple-prefs').prefs,
      xhr = require('xhr'),

      aboutconfig = require('preferences-service');  // Deprecated

/* String constants */
// Preferences, deprecated
const serviceurl_pref = 'extensions.copyshorturl.serviceURL';

// Possible service URLs
const default_service = 'isgd',
      serviceurl_docs = 'http://copy-shorturl.readthedocs.org/en/latest/serviceurl.html';
var serviceurls = {
  isgd: 'http://is.gd/api.php?longurl=%URL%',
  tinyurl: 'http://tinyurl.com/api-create.php?url=%URL%'
};
// Hook up pref button to service URL docs.
require('sdk/simple-prefs').on('serviceurl_docs', function() {
  require('sdk/tabs').open(serviceurl_docs);
});


/** Determine service URL */
function getServiceUrl() {
  if (prefs.service === 'custom' && prefs.customurl) {
    return prefs.customurl;
  } else {
    // Restore default.
    prefs.service = default_service;
  }
  return serviceurls[prefs.service];
}


/** Create a short URL from is.gd, tinyurl, etc. */
function createShortUrl(url) {
    let req = new xhr.XMLHttpRequest();

    try {
      req.open("GET", getServiceUrl().replace(
        '%URL%', encodeURIComponent(url)), false);
      req.send(null);
      if (req.status === 200) {
          notify("No short URL found. Created alternative URL instead:\n" +
                 url + ' --> ' + req.responseText);
          return req.responseText.trim();
      } else {
        throw new Error('ZOMG, error creating short URL.');
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
        label: 'Copy ShortURL',
        contentScriptFile: data.url('js/find-short-url.js'),
        onMessage: function(found_url) {
            let url = found_url['url'];

            if (found_url['short']) {
                notify("Short URL found:\n" + url);
            } else {
                url = createShortUrl(url);
            }

            if (url) clipboard.set(url);
        }
    });
}
