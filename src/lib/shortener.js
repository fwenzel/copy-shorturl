import copyToClipboard from './clipboard';
import notify from './notify';

const _ = browser.i18n.getMessage;

// Service default.
const default_service = 'isgd';

// Specify 'url' for plain-text GET APIs, or request/result for more complex
// variants. Note: return a fetch() promise.
// Do not forget to add origins to permissions in manifest.
const serviceUrls = {
  none: {}, // Placeholder.
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
    return browser.storage.local.get('prefs').then(ret => {
      let prefs = ret['prefs'] || {};
      let service;
      switch (prefs.service) {
        case 'custom':
          service = { url: prefs.custom_url };
          break;
        case 'none':
          return url;  // Skip shortening altogether.
        default:
          service = serviceUrls[prefs['service'] || default_service];
          break;
      }

      if (service.request) {
        req = service.request(url);
      } else {
        let _uri = service.url.replace('%URL%', encodeURIComponent(url));
        req = fetch(_uri);
      }

      return req.then(response => {
        if (response.ok) {
          let result = service.result ? service.result(response) : response.text();
          return result;
        } else {
          throw new Error(_('shorten_error'));
        }
      }).catch(err => {
        notify(err.message);
      });

    }).catch(err => {
      throw new Error(_('shorten_error'));
    });

  } catch (e) {
    notify(e.message);
    return false;
  }
}


/** Finalize (notify and copy to clipboard) a detected or generated URL. */
function finalizeUrl(longUrl, shortUrl, title) {
  browser.storage.local.get('prefs').then(ret => {
    let prefs = ret['prefs'] || {};
    let copyText;

    // Remove whitespace from final URL.
    shortUrl = shortUrl.trim();

    // Add page title, if selected.
    if (prefs.copy_title === true && title) {
      copyText = title + ' ' + shortUrl;
    } else {
      copyText = shortUrl;
    }
    copyToClipboard(copyText);

    if (prefs.notify !== false) {
      notify(shortUrl);
    }
  });
}


/** Handle a URL found on the page */
export default function processUrl(found_url) {
  let url = found_url['url'];
  let title = found_url['title'] || '';
  let hash = found_url['hash'] || '';

  browser.storage.local.get('prefs').then(ret => {
    let prefs = ret['prefs'] || {};

    if (prefs.strip_urm || prefs.keep_hash) {
      let parsedUrl = new URL(url);

      // Remove UTM tracking codes (from Google Analytics) if present.
      if (/[?&]utm_/.test(parsedUrl.search)) {
        // Find and delete all utm_ tracking parameters.
        let utm_match = /[?&](utm_[^=]+)=/;
        while (true) {
          let utm_param = utm_match.exec(parsedUrl.search);
          if (!utm_param) break;
          parsedUrl.searchParams.delete(utm_param[1]);
        }
      }

      // Keep URL hash if present.
      if (prefs.keep_hash && hash) {
        parsedUrl.hash = hash;
      }

      url = parsedUrl.toString();
    }

    // Shorten URL if it's not considered "short" or exceeds length limit.
    if (!found_url['short'] || (prefs.shorten_canonical > 0 && url.length > prefs.shorten_canonical)) {
      createShortUrl(url).then(result => {
        finalizeUrl(url, result, title);
      });
    } else {
      finalizeUrl(null, url, title);
    }
  });
}
