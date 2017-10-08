import copyToClipboard from './clipboard';
import notify from './notify';

const _ = browser.i18n.getMessage;

// Service default.
const default_service = 'isgd';

// Specify 'url' for plain-text GET APIs, or request/result for more complex
// variants. Note: return a fetch() promise.
// Do not forget to add origins to permissions in manifest.
const serviceUrls = {
  isgd: {
    url: 'https://is.gd/api.php?longurl=%URL%'
  },
  tinyurl: {
    url: 'https://tinyurl.com/api-create.php?url=%URL%'
  },
  googl: {
    // https://developers.google.com/url-shortener/v1/getting_started
    request: url => {
      return browser.storage.local.get('prefs').then(ret => {
        let prefs = ret['prefs'] || {};
        if (!prefs.google_apikey) {
          throw new Error(_('apikey_error'));
        }

        let headers = new Headers({
          'Content-Type': 'application/json'
        });
        return fetch('https://www.googleapis.com/urlshortener/v1/url?key=' +
                     prefs.google_apikey, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ longUrl: url })
        });
      });
    },
    result: response => {
      return response.text().then(txt => {
        let shortened = JSON.parse(txt);
        return shortened.id;
      })
    }
  },
  bitly: {
    // http://dev.bitly.com/links.html#v3_shorten
    request: url => {
      return browser.storage.local.get('prefs').then(ret => {
        let prefs = ret['prefs'] || {};
        if (!prefs.bitly_apikey) {
          throw new Error(_('apikey_error'));
        }

        return fetch(`https://api-ssl.bitly.com/v3/shorten?access_token=` +
                     `${prefs.bitly_apikey}&longUrl=${encodeURIComponent(url)}&format=txt`);
      });
    },
    result: response => response.text()
  }
}


/** Create a short URL from is.gd, tinyurl, etc. */
function createShortUrl(url) {
  let req;

  try {
    // Get shortening service from prefs.
    browser.storage.local.get('prefs').then(ret => {
      let prefs = ret['prefs'] || {};
      let service;
      if (prefs['service'] === 'custom') {
        service = { url: prefs.custom_url };
      } else {
        service = serviceUrls[prefs['service'] || default_service];
      }

      if (service.request) {
        req = service.request(url);
      } else {
        let _uri = service.url.replace('%URL%', encodeURIComponent(url));
        req = fetch(_uri);
      }

      req.then(response => {
        if (response.ok) {
          let result = service.result ? service.result(response) : response.text();
          return result;
        } else {
          throw new Error(_('shorten_error'));
        }
      }).then(result => {
        finalizeUrl(url, result);
      }).catch(err => {
        notify(err.message);
      });

    }, err => {
      throw new Error(_('shorten_error'));
    });

  } catch (e) {
    notify(e.message);
    return false;
  }
}


/** Finalize (notify and copy to clipboard) a detected or generated URL. */
function finalizeUrl(long_url, short_url) {
  copyToClipboard(short_url);
  browser.storage.local.get('prefs').then(ret => {
    let prefs = ret['prefs'] || {};
    if (prefs.notify !== false) {
      notify(short_url);
    }
  });
}


/** Handle a URL found on the page */
export default function processUrl(found_url) {
  let url = found_url['url'];

  browser.storage.local.get('prefs').then(ret => {
    let prefs = ret['prefs'] || {};

    // Remove UTM tracking codes (from Google Analytics) if present.
    if (prefs.strip_utm) {
      let parsedUrl = new URL(url);
      if (/[?&]utm_/.test(parsedUrl.search)) {
        // Find and delete all utm_ tracking parameters.
        let utm_match = /[?&](utm_[^=]+)=/;
        while (true) {
          let utm_param = utm_match.exec(parsedUrl.search);
          if (!utm_param) break;
          parsedUrl.searchParams.delete(utm_param[1]);
        }
        url = parsedUrl.toString();
      }
    }

    // Shorten URL if it's not considered "short" or exceeds length limit.
    if (!found_url['short'] || (prefs.shorten_canonical > 0 && url.length > prefs.shorten_canonical)) {
      createShortUrl(url);
    } else {
      finalizeUrl(null, url);
    }
  });
}
