const clipboard = require("clipboard"),
      contextMenu = require("context-menu"),
      data = require("self").data,
      notify = require("simple-notify").notify,
      prefs = require("preferences-service"),
      xhr = require("xhr");

/* String constants */
      // Preferences
      serviceurl_pref = 'extensions.copyshorturl.serviceURL',
      serviceurl_default = 'http://is.gd/api.php?longurl=%URL%';


/** Create a short URL from is.gd, tinyurl, etc. */
function createShortUrl(url) {
    let req = new xhr.XMLHttpRequest();

    var serviceurl = prefs.get(serviceurl_pref, serviceurl_default);
    var service = {};
    switch (serviceurl) {
        case "goo.gl":
            service = {
                method:  "POST",
                url:     "https://www.googleapis.com/urlshortener/v1/url",
                headers: [["Content-Type", "application/json"]],
                data:    '{"longUrl": "' + url + '"}',
                extract: function (response) {
                    return JSON.parse(response).id
                } 
            };
            break;
        //for any api like is.gd
        default:
            service = {
                method:  "GET",
                url:     serviceurl.replace('%URL%', encodeURIComponent(url)),
                headers: null,
                data:    null,
                extract: function (response) {
                    return response
                }
            };
    }
    req.open(service.method, service.url, false);
    if (service.headers) {
        for (var i = 0; i < service.headers.length; i++) {
            req.setRequestHeader(service.headers[i][0], service.headers[i][1])
        }
    }
    req.send(service.data);
    if (req.status == 200) {
        var ret = service.extract(req.responseText);
        notify("No short URL found. Created alternative URL instead:\n" +
               url + ' --> ' + ret);
        return ret.trim();
    } else {
        notify('ZOMG, error creating short URL.');
        return false;
    }
}


exports.main = function(options, callbacks) {
    /* Set URL preference if not set. */
    if (!prefs.has(serviceurl_pref))
        prefs.set(serviceurl_pref, serviceurl_default);

    /* Add and hook up context menu */
    var item = contextMenu.Item({
        label: 'Copy ShortURL',
        contentScriptFile: data.url('js/find-short-url.js'),
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
}
