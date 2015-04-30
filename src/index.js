const _ = require('sdk/l10n').get,
      clipboard = require('sdk/clipboard'),
      contextMenu = require('sdk/context-menu'),
      data = require('sdk/self').data,
      notify = require('./lib/simple-notify').notify,
      prefs = require('sdk/simple-prefs').prefs,
      xhr = require('sdk/net/xhr'),
      tabs = require('sdk/tabs');

const { ActionButton } = require('sdk/ui/button/action'),
      { Cc, Ci, Cu } = require('chrome'),
      { Hotkey } = require('sdk/hotkeys');

// Utils for parsing URLs
// TODO: Use SDK interface instead when it exposes what we need.
Cu.importGlobalProperties(['URL']);

var toolbarButton;

// Service defaults.
const default_service = 'isgd',
      serviceurl_docs = 'http://copy-shorturl.readthedocs.org/en/latest/serviceurl.html';

// Specify 'url' for plain-text GET APIs, or request/result for more complex
// variants. Note: Use asynchronous XHR.
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
            req.open('POST', 'https://www.googleapis.com/urlshortener/v1/url', true);
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


/** Show toolbar button. */
function addToolbarButton() {
    toolbarButton = ActionButton({
        id: 'copy-shorturl-button',
        label: 'Copy ShortURL',
        icon: {
            '16': data.url('img/icon-16.png'),
            '32': data.url('img/icon-32.png'),
            '64': data.url('img/icon-64.png'),
        },
        onClick: buttonAction
    });
}


/** Attach URL detection script to current tab: for hotkey and action button. */
var buttonAction = function() {
    let worker = tabs.activeTab.attach({
        contentScriptFile: data.url('js/find-short-url.js'),
        onMessage: handleDetectedUrl
    });
    worker.port.emit('detect');
}


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


/** Handle a URL (or ShortURL detected in context by find-short-url.js) */
function handleDetectedUrl(found_url) {
    let url = found_url['url'];

    // Remove UTM tracking codes (from Google Analytics) if present.
    if (prefs.strip_utm) {
        var parsedUrl = new URL(url);
        if (/[?&]utm_/.test(parsedUrl.search)) {
            // Find and delete all utm_ tracking parameters.
            var utm_match = /[?&](utm_[^=]+)=/;
            var utm_param;
            while (utm_param = utm_match.exec(parsedUrl.search)) {
                parsedUrl.searchParams.delete(utm_param[1]);
            }
            url = parsedUrl.toString();
        }
    }

    // Shorten URL if it's not considered "short" or exceeds length limit.
    if (!found_url['short'] ||
        (prefs.shorten_canonical > 0 && url.length > prefs.shorten_canonical)) {
        createShortUrl(url);
    } else {
        finalizeUrl(null, url);
    }
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
            req.open('GET', _uri, true);
        }

        req.addEventListener('error', function(e) {
            throw new Error(_('shorten_error'));
        });
        req.addEventListener('load', function() {
            if (req.status === 200) {
                let result = service.result ? service.result(req) : req.responseText.trim();
                finalizeUrl(url, result);
            } else {
                throw new Error(_('shorten_error'));
            }
        });

        req.send(null);

    } catch (e) {
        notify(e.message);
        return false;
    }
}


/** Finalize (notify and copy to clipboard) a detected or generated URL. */
function finalizeUrl(long_url, short_url) {
    notify(short_url);
    clipboard.set(short_url);
}


exports.main = function(options, callbacks) {
    // Enable context menu on all pages
    contextMenu.Item({
        label: _('menuitem_label'),
        image: data.url('img/icon-32.png'),
        contentScriptFile: data.url('js/find-short-url.js'),
        onMessage: handleDetectedUrl
    });

    // Additional context menu on <a> tags.
    contextMenu.Item({
        label: _('shorten_link_label'),
        image: data.url('img/icon-32.png'),
        context: contextMenu.SelectorContext('a[href]'),
        contentScriptFile: data.url('js/shorten-link-href.js'),
        onMessage: handleDetectedUrl
    });

    // Hotkey for the same functionality.
    Hotkey({
        combo: 'accel-shift-l',
        onPress: buttonAction
    });

    // Toolbar button if enabled.
    if (prefs.toolbar_button) {
        addToolbarButton();
    }

    // Add/remove toolbar button on pref change.
    require('sdk/simple-prefs').on('toolbar_button', function() {
        if (!prefs.toolbar_button) {
            toolbarButton.destroy();
            toolbarButton = null;
        } else if (!toolbarButton) {
            addToolbarButton();
        }
    })
}
