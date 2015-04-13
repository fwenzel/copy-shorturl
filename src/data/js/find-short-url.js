// Site-defined *short* URLs.
const short_selectors = 'link[rev=canonical],link[rel=shorturl],link[rel=shortlink]';
// Site-defined *long* URLs.
const long_selectors = 'link[rel=canonical], meta[property="og:url"]';

/** Find short URL in the page */
function findShortUrl() {
    let short = document.querySelector(short_selectors),
        link;
    if (short && (link = short.href)) {
        self.postMessage({short: true, url: link});
    } else {
        // Use canonical URL if it exists, else Facebook OpenGraph or finally, document URL.
        let canonical = document.querySelector(long_selectors);
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
