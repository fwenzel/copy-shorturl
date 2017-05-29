/** Graciously borrowed from MDN webextensions examples. */

export default function copyToClipboard(text) {
  // clipboard-helper.js defines function copyToClipboard in content script.
  const code = "copyToClipboard(" + JSON.stringify(text) + ");";

  browser.tabs.executeScript({
    code: "typeof copyToClipboard === 'function';",
  }).then(function(results) {
    // The content script's last expression will be true if the function
    // has been defined. If this is not the case, then we need to run
    // clipboard-helper.js to define function copyToClipboard.
    if (!results || results[0] !== true) {
      return browser.tabs.executeScript({
        file: "/data/js/clipboard-helper.js",
      });
    }
  }).then(function() {
    return browser.tabs.executeScript({
      code,
    });
  }).catch(function(error) {
    // This could happen if the extension is not allowed to run code in
    // the page, for example if the tab is a privileged page.
    // TODO i18n
    console.error("Failed to copy text: " + error);
  });
}
