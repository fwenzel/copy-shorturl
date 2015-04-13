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
        // Use canonical URL if it exists, else Facebook OpenGraph or finally, document URL.
        let canonical = document.querySelector('link[rel=canonical], meta[property="og:url"]');
        link = (canonical && (canonical.href || canonical.content));  // link->href, meta->content
        if (!link) {  // Document URL fallback.
            link = document.location.href;
        }

        self.postMessage({short: false, url: link});
    }
}

// For Hotkey, hook up content script to port object.
self.port.on('detect', findShortUrl);
// For context menu, hook up to click event.
self.on('click', findShortUrl);
