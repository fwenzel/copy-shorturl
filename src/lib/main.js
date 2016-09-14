const simpleprefs = require('sdk/simple-prefs');
const tabs = require('sdk/tabs');

const buttons = require('./buttons');

const SERVICEURL_DOCS = 'http://copy-shorturl.readthedocs.org/en/latest/serviceurl.html';


exports.main = function(options, callbacks) {
  // Hook up pref button to service URL docs.
  simpleprefs.on('serviceurl_docs', function() {
    tabs.open(SERVICEURL_DOCS);
  });

  buttons.init();
}
