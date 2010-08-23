const {Cc,Ci} = require("chrome"),
      clipboard = require("clipboard"),
      contextMenu = require("context-menu"),
      notifications = require("notifications"),
      prefs = require("preferences-service"),
      tabs = require("tabs"),
      xhr = require("xhr");

/* String constants */
const addon_name = 'Copy ShortURL',
      addon_icon = packaging.getURLForData('/ruler.png'),
      addon_icon32 = packaging.getURLForData('/ruler32.png'),
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

/** Growl notifications with notificationbox fallback */
function notify(txt, win) {
    try {
        notifications.notify({
            title: addon_name,
            iconURL: addon_icon32,
            text: txt
        });
    } catch (e) {
        /* "Yellow bar" fallback if we don't have Growl */
        console.log(txt);
        let nb = getNotificationBox(),
            notification = nb.appendNotification(
            txt,
            'jetpack-notification-box',
            addon_icon || 'chrome://browser/skin/Info.png',
            nb.PRIORITY_INFO_MEDIUM,
            []
        );
        require("timer").setTimeout(function() {
            notification.close();
        }, 10 * 1000);
    }
}

/**
 * Get notification box ("yellow bar").
 * Courtesy of bug 533649.
 */
function getNotificationBox() {
    let wm = Cc["@mozilla.org/appshell/window-mediator;1"]
             .getService(Ci.nsIWindowMediator),
        chromeWindow = wm.getMostRecentWindow("navigator:browser"),
        notificationBox = chromeWindow.getNotificationBox(require("tabs").activeTab.contentWindow);
    return notificationBox;
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
