(function() {
  /** Find short URL in the page */
  function findShortUrl() {
    // Example: https://www.amazon.com/dp/ABC012345DE
    const matches = document.location.href.match(new RegExp('/dp/(\\w+)'));

    if (matches) {
      const title = document.querySelector('title').text;
      const shortened = new URL(`/${matches[1]}`, 'https://amzn.com');

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
