var clipboard = require("clipboard").clipboard,
    contextMenu = require("context-menu"),
    tabs = require("tabs"),
    xhr = require("xhr");
var selectors = 'link[rev=canonical],link[rel=shorturl],link[rel=shortlink]';

/** Find short URL in the page */
function findShortUrl(ctx) {
    let doc = ctx.document,
        short = doc.querySelector(selectors),
        link;
    if (short && (link = short.getAttribute('href')))
        return link;
    return false;
}

/** Create a short URL from tinyurl.com */
function createShortUrl(ctx) {
    let req = new xhr.XMLHttpRequest(),
        url, canonical;
    // use canonical URL if it exists, current URL otherwise.
    canonical = ctx.document.querySelector('link[rel=canonical]');
    if (!(canonical && (url = canonical.getAttribute('href'))))
        url = ctx.document.URL;
    req.open("GET", "http://tinyurl.com/api-create.php?url="
             +encodeURIComponent(url), false);
    req.send(null);
    if (req.status == 200) {
        console.log(url + ' --> ' + req.responseText);
        return req.responseText;
    } else {
        console.warning('ZOMG, could not create short URL.');
        return false;
    }
}

exports.main = function() {
    var item = contextMenu.Item({
        label: 'Copy ShortURL',
        onClick: function(ctx, item) {
            url = findShortUrl(ctx);
            if (!url) {
                url = createShortUrl(ctx);
            }
            if (url) clipboard.set(url);
        }
    });
    contextMenu.add(item);
}

