const clipboard = require("clipboard"),
      contextMenu = require("context-menu"),
      data = require("self").data,
      notify = require("simple-notify").notify,
      prefs = require("preferences-service"),
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
        return req.responseText.trim();
    } else {
        notify('ZOMG, error creating short URL.');
        return false;
    }
}


exports.main = function(options, callbacks) {
    /* Set URL preference if not set. */
    if (!prefs.has(serviceurl_pref))
        prefs.set(serviceurl_pref, serviceurl_default);

    var onMessage = function(found_url) {
        let url = found_url['url'];

        if (found_url['short']) {
            notify("Short URL found:\n" + url);
        } else {
            url = createShortUrl(url);
        }
        if (url) clipboard.set(url);
    }

    /* Add and hook up context menu */
    var item_page = contextMenu.Item({
        label: 'Copy ShortURL',
        contentScriptFile: data.url('js/find-short-url.js'),
        onMessage: onMessage
    });

    var item_hash = contextMenu.Item({
        label: 'Copy ShortURL with hash',
        context: contextMenu.SelectorContext("a[href]"),
        contentScriptFile: [data.url('js/is-permlink-hash.js'),
                            data.url('js/find-short-url.js')
                           ],
        onMessage: onMessage
    });
}
