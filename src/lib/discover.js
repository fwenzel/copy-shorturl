import notify from './notify';
import processUrl from './shortener';

const _ = browser.i18n.getMessage;


/** Default discovery content script for any tab. */
function genericDiscovery() {
  browser.tabs.executeScript({
    file: '/data/js/find-short-url.js'
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
  // browser.tabs.getCurrent()
  browser.storage.local.get('prefs').then(ret => {
    const prefs = ret['prefs'] || {};

    browser.tabs.query({active: true, currentWindow: true})
    .then(tabs => {
      const url = new URL(tabs[0].url);

      // Trigger special URL logic for certain origins.
      // Most the time, just generically discover URLs.
      switch (prefs.use_special !== false) {  // Will never match if preffed off.
        case /(www\.)youtube\.com/.test(url.hostname):
          browser.tabs.executeScript({
            file: '/data/js/discover/youtube.js'
          });
          break;

        default:
          genericDiscovery();
      }
    });
  });
}

/** Listen to content scripts posting back after discovery */
browser.runtime.onMessage.addListener(msg => {
  // If specialty discoverer returns it did not find anything, apply default
  // discovery mechanism and listen again.
  if (!msg.url) {
    genericDiscovery();
  } else {
    processUrl(msg);
  }
});
