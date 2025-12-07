import notify from './notify.js';
import processUrl from './shortener.js';

const _ = browser.i18n.getMessage;


/** Execute discovery content script in the current tab. */
async function runDiscoveryScript(script) {
  try {
    await browser.tabs.executeScript({
      file: `/data/js/discover/${script}.js`
    });
  } catch (e) {
    if (e.message && /Missing host permission for the tab/.test(e.message)) {
      notify(_('error_host_permission'));
    } else {
      throw e;
    }
  }
}


/**
 * Execute content script to discover canonical short URL on current tab,
 * then listen to it being returned via message.
 */
export default async function discoverUrl() {
  try {
    const ret = await browser.storage.local.get('prefs');
    const prefs = ret['prefs'] || {};
    let script = 'default';

    // Do not investigate special cases if preffed off.
    if (prefs.use_special !== false) {
      const tabs = await browser.tabs.query({active: true, currentWindow: true});
      const url = new URL(tabs[0].url);

      // Trigger special URL logic for certain origins.
      // Most the time, just generically discover URLs.
      switch (true) {
        case /(www\.)?amazon\.com/.test(url.hostname):
          script = 'amazon';
          break;

        case /(www\.)?youtube\.com/.test(url.hostname):
          script = 'youtube';
          break;

        default:
          script = 'default';
          break;
      }
    }

    await runDiscoveryScript(script);
  } catch (err) {
    notify(err.message);
  }
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
