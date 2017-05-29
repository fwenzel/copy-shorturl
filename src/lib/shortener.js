import copyToClipboard from './clipboard';
import notify from './notify';

const _ = browser.i18n.getMessage;

// Service default.
const default_service = 'isgd';

// Specify 'url' for plain-text GET APIs, or request/result for more complex
// variants. Note: Use asynchronous XHR.
// TODO add other services back.
const serviceUrls = {
  isgd: {
    url: 'https://is.gd/api.php?longurl=%URL%'
  }
}


/** Determine service URL */
function getShorteningService() {
  // TODO hook up preferences again.
  return serviceUrls[default_service];
}

/** Create a short URL from is.gd, tinyurl, etc. */
function createShortUrl(url) {
  let req;
  let service = getShorteningService();

  try {
    if (service.request) {
      req = service.request(url);
    } else {
      req = new XMLHttpRequest();
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
  copyToClipboard(short_url);
  notify(short_url);
}


/** Handle a URL found on the page */
export default function processUrl(found_url) {
  let url = found_url['url'];

  // Remove UTM tracking codes (from Google Analytics) if present.
  if (true) { //  TODO: (prefs.strip_utm) {
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
  if (!found_url['short']) { //TODO ||
    //(prefs.shorten_canonical > 0 && url.length > prefs.shorten_canonical)) {
    createShortUrl(url);
  } else {
    finalizeUrl(null, url);
  }
}
