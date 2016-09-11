const notifications = require('sdk/notifications');
const data = require('sdk/self').data;

const addon_name = 'Copy ShortURL';
const addon_icon32 = data.url('img/icon-32.png');


exports.notify = function(txt) {
  notifications.notify({
    title: addon_name,
    text: txt,
    iconURL: addon_icon32
  })
}
