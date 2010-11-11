const {Cc,Ci} = require("chrome"),
      notifications = require("notifications"),
      prefs = require("preferences-service"),
      self = require("self"),
      tabs = require("tabs"),
      timer = require("timer");

const addon_name = 'Copy ShortURL',
      addon_icon = self.data.url('img/ruler.png'),
      addon_icon32 = self.data.url('img/ruler32.png'),

      // Preferences
      notification_pref = 'extensions.copyshorturl.notifications',
      notification_default = 2;

/** Growl notifications with notificationbox fallback */
function notify(txt) {
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
function boxNotify(txt) {
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

/* Exports */
exports.notify = notify;
exports.growlNotify = growlNotify;
exports.boxNotify = boxNotify;
