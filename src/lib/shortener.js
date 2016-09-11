const _ = require('sdk/l10n').get;
const clipboard = require('sdk/clipboard');
const data = require('sdk/self').data;
const prefs = require('sdk/simple-prefs').prefs;
const xhr = require('sdk/net/xhr');

const { Cc, Ci, Cu } = require('chrome');

const notify = require('./notify').notify;


// Utils for parsing URLs
// TODO: Use SDK interface instead when it exposes what we need.
Cu.importGlobalProperties(['URL']);

// Service defaults.
const default_service = 'isgd',
      serviceurl_docs = 'http://copy-shorturl.readthedocs.org/en/latest/serviceurl.html';

// Specify 'url' for plain-text GET APIs, or request/result for more complex
// variants. Note: Use asynchronous XHR.
var serviceurls = {
  isgd: {
    url: 'https://is.gd/api.php?longurl=%URL%'
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


/** Create a short URL from is.gd, tinyurl, etc. */
function createShortUrl(url) {
  let req;
  let service = getShorteningService();

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
  clipboard.set(short_url);
  notify(short_url);
}


/** Handle a URL found on the page */
exports.processUrl = function(found_url) {
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

