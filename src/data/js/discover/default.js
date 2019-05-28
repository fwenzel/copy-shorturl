(function() {
// Site-defined *short* URLs.
const short_selectors = 'link[rev=canonical],link[rel=shorturl],link[rel=shortlink]';
// Site-defined *long* URLs.
const long_selectors = 'link[rel=canonical]';

/** Find short URL in the page */
function findShortUrl() {
  const title = document.querySelector('title').text;
  let short = document.querySelector(short_selectors);
  let is_short;
  let link;

  if (short && (link = short.href)) {
    is_short = true;
  } else {
    // Use canonical URL if it exists, else Facebook OpenGraph or finally, document URL.
    let canonical = document.querySelector(long_selectors);
    link = (canonical && (canonical.href || canonical.content));  // link->href, meta->content
    if (!link) {  // Document URL fallback.
      link = document.location.href;
    }
    is_short = false;
  }

  // Moment of truth, avoid sending invalid URLs anywhere.
  try {
    new URL(link);
  } catch (e) {
    console.warn(e);
    link = document.location.href;
  }

  return {
    short: is_short,
    url: link,
    hash: document.location.hash,
    title: title
  };
}

browser.runtime.sendMessage(findShortUrl());

}());
