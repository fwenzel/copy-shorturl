const _ = browser.i18n.getMessage;

const addon_name = 'Copy ShortURL';
const addon_icon32 = browser.extension.getURL('data/img/icon-32.png');


export default function notify(txt) {
  browser.notifications.create({
    type: 'basic',
    title: addon_name,
    message: txt,
    iconUrl: addon_icon32
  })
}
