const simpleprefs = require('sdk/simple-prefs');

const buttons = require('./buttons');


exports.main = function(options, callbacks) {
  // Hook up pref button to service URL docs.
  simpleprefs.on('serviceurl_docs', function() {
    tabs.open(serviceurl_docs);
  });

  buttons.init();
}
