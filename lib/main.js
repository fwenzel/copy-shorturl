const {Cc,Ci} = require("chrome"),
      clipboard = require("clipboard"),
      contextMenu = require("context-menu"),
      notifications = require("notifications"),
      prefs = require("preferences-service"),
      tabs = require("tabs"),
      timer = require("timer"),
      xhr = require("xhr");

/* String constants */
const addon_name = 'Copy ShortURL',
      addon_icon = packaging.getURLForData('/ruler.png'),
      addon_icon32 = packaging.getURLForData('/ruler32.png'),
      selectors = 'link[rev=canonical],link[rel=shorturl],link[rel=shortlink]',

      // Preferences
      pref_base = 'extensions.copyshorturl.',
      serviceurl_pref = pref_base + 'serviceURL',
      serviceurl_default = 'http://is.gd/api.php?longurl=%URL%',
      notification_pref = pref_base + 'notifications',
      notification_default = 2;


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
        url = ctx.document.location.href;

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

/** Growl notifications with notificationbox fallback */
function notify(txt, win) {
    /* Set URL preference if not set. */
    if (!prefs.has(notification_pref))
        prefs.set(notification_pref, notification_default);

    switch (prefs.get(notification_pref, notification_default)) {
    // No notifications
    case 0:
        return;

    // Box only
    case 1:
        boxNotify(txt, win);
        break;

    // Growl with box fallback
    default:
    case 2:
        try {
            growlNotify(txt);
        } catch (e) {
            boxNotify(txt, win);
        }
        break;
    }
}

/** Notify via Growl */
function growlNotify(txt) {
    notifications.notify({
        title: addon_name,
        iconURL: addon_icon32,
        text: txt
    });
}

/** Notify via notification box. */
function boxNotify(txt, win) {
    console.log(txt);
    let nb = getNotificationBox(),
        notification = nb.appendNotification(
        txt,
        'jetpack-notification-box',
        addon_icon || 'chrome://browser/skin/Info.png',
        nb.PRIORITY_INFO_MEDIUM,
        []
    );
    timer.setTimeout(function() {
        notification.close();
    }, 10 * 1000);
}

/**
 * Get notification box ("yellow bar").
 * Courtesy of bug 533649.
 */
function getNotificationBox() {
    let wm = Cc["@mozilla.org/appshell/window-mediator;1"]
             .getService(Ci.nsIWindowMediator),
        chromeWindow = wm.getMostRecentWindow("navigator:browser"),
        notificationBox = chromeWindow.getNotificationBox(tabs.activeTab.contentWindow);
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
