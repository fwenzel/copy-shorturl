const clipboard = require("clipboard"),
      contextMenu = require("context-menu"),
      notify = require("simple-notify").notify,
      prefs = require("preferences-service"),
      self = require("self"),
      xhr = require("xhr");

/* String constants */
      // Preferences
      serviceurl_pref = 'extensions.copyshorturl.serviceURL',
      serviceurl_default = 'http://is.gd/api.php?longurl=%URL%';


/** Create a short URL from is.gd, tinyurl, etc. */
function createShortUrl(url) {
    let req = new xhr.XMLHttpRequest();

    req.open("GET", prefs.get(serviceurl_pref, serviceurl_default).replace(
        '%URL%', encodeURIComponent(url)), false);
    req.send(null);
    if (req.status == 200) {
        notify("No short URL found. Created alternative URL instead:\n" +
               url + ' --> ' + req.responseText);
        return req.responseText.replace(/(^\s+|\s+$)/g, '');
    } else {
        notify('ZOMG, error creating short URL.');
        return false;
    }
}


exports.main = function(options, callbacks) {
    /* Set URL preference if not set. */
    if (!prefs.has(serviceurl_pref))
        prefs.set(serviceurl_pref, serviceurl_default);

    /* Add and hook up context menu */
    var item = contextMenu.Item({
        label: 'Copy ShortURL',
        contentScriptURL: self.data.url('js/find-short-url.js'),
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
