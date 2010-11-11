const {Cc,Ci} = require("chrome"),
      clipboard = require("clipboard"),
      contextMenu = require("context-menu"),
      notifications = require("notifications"),
      prefs = require("preferences-service"),
      self = require("self"),
      tabs = require("tabs"),
      timer = require("timer"),
      xhr = require("xhr");

/* String constants */
const addon_name = 'Copy ShortURL',
      addon_icon = self.data.url('img/ruler.png'),
      addon_icon32 = self.data.url('img/ruler32.png'),

      // Preferences
      pref_base = 'extensions.copyshorturl.',
      serviceurl_pref = pref_base + 'serviceURL',
      serviceurl_default = 'http://is.gd/api.php?longurl=%URL%',
      notification_pref = pref_base + 'notifications',
      notification_default = 2;


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
    contextMenu.add(item);
}
