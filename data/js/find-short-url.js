/* String constants. */
const selectors = 'link[rev=canonical],link[rel=shorturl],link[rel=shortlink]';


/** Find short URL in the page */
self.on('click', function(node, data) {
    let short = document.querySelector(selectors),
        hash = node.hash ? node.hash : '',
        link;
    if (short && (link = short.href)) {
        self.postMessage({short: true, url: link + hash});
        return;
    } else {
        // use canonical URL if it exists, current URL otherwise.
        let canonical = document.querySelector('link[rel=canonical]');
        if (!(canonical && (link = canonical.href)))
            link = document.location.href;

        self.postMessage({short: false, url: link + hash});
    }
});
