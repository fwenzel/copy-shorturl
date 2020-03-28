(function() {
  // Just pass through document location, but enforce git.io shortener.
  browser.runtime.sendMessage({
    short: false,
    url: document.location.href,
    hash: document.location.hash,
    title: document.title,
    force_service: 'gitio'
  });
}());
