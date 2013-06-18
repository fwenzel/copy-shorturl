/* String constants. */
const selectors = 'link[rev=canonical],link[rel=shorturl],link[rel=shortlink]';


/** Find short URL in the page */
function findShortUrl() {
    let short = document.querySelector(selectors),
        link;
    if (short && (link = short.href)) {
        self.postMessage({short: true, url: link});
        return;
    } else {
        // use canonical URL if it exists, current URL otherwise.
        let canonical = document.querySelector('link[rel=canonical]');
        if (!(canonical && (link = canonical.href)))
            link = document.location.href;

        self.postMessage({short: false, url: link});
    }
}

// For Hotkey, hook up content script to port object.
self.port.on('detect', findShortUrl);
// For context menu, hook up to click event.
self.on('click', findShortUrl);
