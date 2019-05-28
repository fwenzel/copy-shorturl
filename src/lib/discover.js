import notify from './notify';
import processUrl from './shortener';

const _ = browser.i18n.getMessage;


/** Execute discovery content script in the current tab. */
function runDiscoveryScript(script) {
  browser.tabs.executeScript({
    file: `/data/js/discover/${script}.js`
  }).catch(e => {
    if (e.message && /Missing host permission for the tab/.test(e.message)) {
      notify(_('error_host_permission'));
    } else {
      throw e;
    }
  });
}


/**
 * Execute content script to discover canonical short URL on current tab,
 * then listen to it being returned via message.
 */
export default function discoverUrl() {
  browser.storage.local.get('prefs').then(ret => {
    const prefs = ret['prefs'] || {};

    // Do not investigate special cases if preffed off.
    if (prefs.use_special === false) {
      return 'default';
    }

    return browser.tabs.query({active: true, currentWindow: true})
    .then(tabs => {
      const url = new URL(tabs[0].url);

      // Trigger special URL logic for certain origins.
      // Most the time, just generically discover URLs.
      switch (true) {
        case /(www\.)?amazon\.com/.test(url.hostname):
          return 'amazon';

        case /(www\.)?github\.com/.test(url.hostname):
          return 'github';

        case /(www\.)?youtube\.com/.test(url.hostname):
          return 'youtube';

        default:
          return 'default';
      }
    });
  })
  .then(script => runDiscoveryScript(script));
}

/** Listen to content scripts posting back after discovery */
browser.runtime.onMessage.addListener(msg => {
  // If specialty discoverer returns it did not find anything, apply default
  // discovery mechanism and listen again.
  if (!msg.url) {
    runDiscoveryScript('default');
  } else {
    processUrl(msg);
  }
});
