(function() {
  /** Find short URL in the page */
  function findShortUrl() {
    const url = new URL(document.location);

    if (url.pathname === '/watch' && url.searchParams.get('v')) {
      const title = document.querySelector('title').text;
      const shortened = new URL(`/${url.searchParams.get('v')}`, 'https://youtu.be');

      return {
        short: true,
        url: shortened.href,
        hash: document.location.hash,
        title: title
      }
    }

    // Fall back to defaults.
    return {}
  }

  browser.runtime.sendMessage(findShortUrl());
}());
