import notify from './notify.js';

const _ = browser.i18n.getMessage;

// Service default.
const DEFAULT_SERVICE = 'isgd';

// Specify 'url' for plain-text GET APIs, or request/result for more complex
// variants. Note: return a fetch() promise.
// Do not forget to add origins to permissions in manifest.
const serviceUrls = {
  none: {}, // Placeholder.

  isgd: {
    url: 'https://is.gd/api.php?longurl=%URL%'
  },

  tinyurl: {
    url: 'https://tinyurl.com/api-create.php?url=%URL%',
    force_https: true
  },

  cuttly: {
    request: url => {
      let form = new FormData();
      form.append('url', url);
      form.append('domain', 0);  // Needed?
      return fetch('https://cutt.ly/scripts/shortenUrl.php', {
        method: 'POST',
        body: form
      });
    },
    result: response => response.text()
  },

  vurl: {
    url: 'https://vurl.com/api.php?url=%URL%',
    force_https: true
  },

  bitly: {
    // https://dev.bitly.com/v4/#operation/createBitlink
    request: async url => {
      const ret = await browser.storage.local.get('prefs');
      const prefs = ret['prefs'] || {};
      if (!prefs.bitly_apikey) {
        throw new Error(_('apikey_error'));
      }

      return fetch('https://api-ssl.bitly.com/v4/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${prefs.bitly_apikey}`
        },
        body: JSON.stringify({'long_url': url})
      });
    },
    result: async response => {
      const res = await response.json();
      return res['link'];
    },
    force_https: true
  },

  /** Special services: Cannot be chosen manually. **/
  gitio: {
    // https://github.blog/2011-11-10-git-io-github-url-shortener/
    request: url => fetch('https://git.io/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'manual',
      body: `url=${encodeURIComponent(url)}`
    }),
    result: response => response.headers.get('Location'),
  },
}


/** Create a short URL from is.gd, tinyurl, etc. */
function createShortUrl(url, force_service) {
  let req;

  try {
    // Get shortening service from prefs.
    return browser.storage.local.get('prefs').then(ret => {
      const prefs = ret['prefs'] || {};
      let service;

      // Hardcoded special-cased websites can enforce a shortening service.
      if (prefs.service !== 'none' && force_service) {
        service = serviceUrls[force_service];
      } else {
        switch (prefs.service) {
          case 'custom':
            service = { url: prefs.custom_url };
            break;
          case 'none':
            return url;  // Skip shortening altogether.
          default:
            service = serviceUrls[prefs.service];
            service ||= serviceUrls[DEFAULT_SERVICE];  // Fallback to default.
            break;
        }
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
      }).then(url => {
        // Rewrite shortened URL to https if the service requires it.
        if (service.force_https || false) {
          let parsedUrl = new URL(url);
          parsedUrl.protocol = 'https';
          url = parsedUrl.href;
        }
        return url;
      }).catch(err => {
        notify(err.message);
      });

    }).catch(err => {
      console.log(err.message);
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
    const prefs = ret['prefs'] || {};
    let copyText;

    // Remove whitespace from final URL.
    shortUrl = shortUrl.trim();

    // Add page title, if selected.
    if (prefs.copy_title === true && title) {
      copyText = title + ' ' + shortUrl;
    } else {
      copyText = shortUrl;
    }
    navigator.clipboard.writeText(copyText);

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
    const prefs = ret['prefs'] || {};

    if (prefs.strip_urm !== false || prefs.keep_hash !== false) {
      let parsedUrl = new URL(url);

      // Remove UTM tracking codes (from Google Analytics) if present.
      if (prefs.strip_urm !== false && /[?&]utm_/.test(parsedUrl.search)) {
        // Find and delete all utm_ tracking parameters.
        const utm_match = /[?&](utm_[^=]+)=/;
        while (true) {
          let utm_param = utm_match.exec(parsedUrl.search);
          if (!utm_param) break;
          parsedUrl.searchParams.delete(utm_param[1]);
        }
      }

      // Keep URL hash if present.
      if (prefs.keep_hash !== false && hash) {
        parsedUrl.hash = hash;
      }

      url = parsedUrl.toString();
    }

    // Shorten URL if it's not considered "short" or exceeds length limit.
    if (!found_url['short'] || (prefs.shorten_canonical > 0 && url.length > prefs.shorten_canonical)) {
      createShortUrl(url, found_url['force_service'])
      .then(result => finalizeUrl(url, result, title));
    } else {
      finalizeUrl(null, url, title);
    }
  });
}
