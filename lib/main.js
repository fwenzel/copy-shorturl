const clipboard = require("clipboard"),
      contextMenu = require("context-menu"),
      notifications = require("notifications"),
      prefs = require("preferences-service"),
      tabs = require("tabs"),
      xhr = require("xhr");

/* Prompt service for simple popup dialog fallback if we don't have Growl */
const {Cc,Ci} = require("chrome"),
      promptSvc = Cc["@mozilla.org/embedcomp/prompt-service;1"].
                  getService(Ci.nsIPromptService);

/* String constants */
const name = 'Copy ShortURL',
      selectors = 'link[rev=canonical],link[rel=shorturl],link[rel=shortlink]',
      serviceurl_pref = 'extensions.copyshorturl.serviceURL',
      serviceurl_default = 'http://is.gd/api.php?longurl=%URL%';


/** Find short URL in the page */
function findShortUrl(ctx) {
    let doc = ctx.document,
        short = doc.querySelector(selectors),
        link;
    if (short && (link = short.href)) {
        notify("Short URL found:\n" + link);
        return link;
    }
    return false;
}

/** Create a short URL from tinyurl.com */
function createShortUrl(ctx) {
    let req = new xhr.XMLHttpRequest(),
        url, canonical;
    // use canonical URL if it exists, current URL otherwise.
    canonical = ctx.document.querySelector('link[rel=canonical]');
    if (!(canonical && (url = canonical.href)))
        url = ctx.document.URL;

    req.open("GET", prefs.get(serviceurl_pref, serviceurl_default).replace(
                '%URL%', encodeURIComponent(url)), false);
    req.send(null);
    if (req.status == 200) {
        notify("No short URL found. Created alternative URL instead:\n" +
               url + ' --> ' + req.responseText);
        return req.responseText;
    } else {
        notify('ZOMG, error creating short URL.');
        return false;
    }
}

/** Growl notifications with dialog fallback */
function notify(txt) {
    try {
        notifications.notify({text: txt});
    } catch (e) {
        console.log(txt);
        promptSvc.alert(null, "["+name+"]", txt);
    }
}

exports.main = function(options, callbacks) {
    /* Set URL preference if not set. */
    if (!prefs.has(serviceurl_pref))
        prefs.set(serviceurl_pref, serviceurl_default);

    /* Add and hook up context menu */
    var item = contextMenu.Item({
        label: 'Copy ShortURL',
        onClick: function(ctx, item) {
            var url = findShortUrl(ctx);
            if (!url) {
                url = createShortUrl(ctx);
            }
            if (url) clipboard.set(url);
        }
    });
    contextMenu.add(item);
}
