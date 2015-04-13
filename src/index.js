const _ = require('sdk/l10n').get,
      clipboard = require('sdk/clipboard'),
      contextMenu = require('sdk/context-menu'),
      data = require('sdk/self').data,
      notify = require('./lib/simple-notify').notify,
      prefs = require('sdk/simple-prefs').prefs,
      xhr = require('sdk/net/xhr'),
      tabs = require('sdk/tabs'),
      // Deprecated
      aboutconfig = require('sdk/preferences/service');

const { Cc, Ci, Cu } = require('chrome'),
      { Hotkey } = require('sdk/hotkeys');

// Utils for parsing URLs
// TODO: Use SDK interface instead when it exposes what we need.
Cu.importGlobalProperties(['URL']);


// about:config preferences, deprecated
const serviceurl_pref = 'extensions.copyshorturl.serviceURL';

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
        finalizeUrl(null, url, true);
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
                finalizeUrl(url, result, false);
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
function finalizeUrl(long_url, short_url, found) {
    if (found) {
        notify(_('found_notice') + "\n" + short_url);
    } else {
        notify(_('none_found_notice') + '\n' + long_url + ' --> ' + short_url);
    }

    if (short_url) clipboard.set(short_url);
}


exports.main = function(options, callbacks) {
    // Set URL from preference if set in old version of add-on.
    if (aboutconfig.has(serviceurl_pref)) {
        prefs.service = 'custom';
        prefs.customurl = aboutconfig.get(serviceurl_pref);
        aboutconfig.reset(serviceurl_pref);
    }

    // Enable context menu on all pages
    var item = contextMenu.Item({
        label: _('menuitem_label'),
        contentScriptFile: data.url('js/find-short-url.js'),
        onMessage: handleDetectedUrl
    });

    // Enable hot key for the same functionality.
    Hotkey({
        combo: 'accel-shift-l',
        onPress: function() {
            let worker = tabs.activeTab.attach({
                contentScriptFile: data.url('js/find-short-url.js'),
                onMessage: handleDetectedUrl
            });
            worker.port.emit('detect');
        }
    });
}
