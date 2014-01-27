const { Cc, Ci } = require('chrome'),
      data = require('sdk/self').data,
      prefs = require('sdk/preferences/service'),
      timer = require('sdk/timers'),
      windowutils = require('sdk/deprecated/window-utils');

const addon_name = 'Copy ShortURL',
      addon_icon = data.url('img/ruler.png'),
      addon_icon32 = data.url('img/ruler32.png'),

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
        boxNotify(txt);
        break;

    // Growl with box fallback
    default:
    case 2:
        try {
            growlNotify(txt);
        } catch (e) {
            boxNotify(txt);
        }
        break;
    }
}

/** Notify via Growl. Throws exception if unavailable. */
function growlNotify(txt) {
    // Ugly: Import alert service. If unavailable, throws exception.
    // Would use notifications.notify if that let me know when Growl is
    // unavailable.
    let alertServ = Cc["@mozilla.org/alerts-service;1"].
                    getService(Ci.nsIAlertsService);
    alertServ.showAlertNotification(
        addon_icon32,  // icon
        addon_name,    // title
        txt            // text
    );
}

/** Notify via notification box. */
function boxNotify(txt) {
    let nb = getNotificationBox(),
        notification = nb.appendNotification(
        txt,
        'jetpack-notification-box',
        addon_icon || 'chrome://browser/skin/Info.png',
        nb.PRIORITY_INFO_MEDIUM,
        []
    );
    timer.setTimeout(function() {
        if (notification && notification.close) {
            notification.close();
        }
    }, 10 * 1000);
}

/**
 * Get notification box ("yellow bar").
 * Courtesy of bug 533649.
 */
function getNotificationBox() {
    let browser = windowutils.activeBrowserWindow.gBrowser,
        notificationBox = browser.getNotificationBox();
    return notificationBox;
}

/* Exports */
exports.notify = notify;
exports.growlNotify = growlNotify;
exports.boxNotify = boxNotify;
