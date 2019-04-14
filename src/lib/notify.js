const _ = browser.i18n.getMessage;

const manifest = browser.runtime.getManifest();
const addon_icon = browser.extension.getURL('data/img/icon.svg');


export default function notify(txt) {
  browser.notifications.create({
    type: 'basic',
    title: manifest.name,
    message: txt,
    iconUrl: addon_icon
  })
}
