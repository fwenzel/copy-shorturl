const notifications = require('sdk/notifications'),
      data = require('sdk/self').data;

const addon_name = 'Copy ShortURL',
      addon_icon32 = data.url('img/icon-32.png');


function notify(txt) {
  notifications.notify({
    title: addon_name,
    text: txt,
    iconURL: addon_icon32
  })
}

exports.notify = notify;
