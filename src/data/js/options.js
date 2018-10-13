const options = {
  service: {
    attr: 'value',
    def: 'isgd'
  },
  google_apikey: {
    attr: 'value',
    def: ''
  },
  bitly_apikey: {
    attr: 'value',
    def: ''
  },
  custom_url: {
    attr: 'value',
    def: ''
  },
  shorten_canonical: {
    attr: 'value',
    def: 30
  },
  strip_urm: {
    attr: 'checked',
    def: true
  },
  keep_hash: {
    attr: 'checked',
    def: false
  },
  notify: {
    attr: 'checked',
    def: true
  },
  copy_title: {
    attr: 'checked',
    def: false
  }
}
let savedTimeout; // Hide saved indicator after a bit.


function init() {
  // Initialize i18n.
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = browser.i18n.getMessage(node.dataset.i18n);
  });

  // Restore settings.
  browser.storage.local.get('prefs').then((res) => {
    let currentPrefs = res['prefs'] || {};
    Object.keys(options).forEach((id) => {
      let val = (typeof currentPrefs[id] !== 'undefined') ? currentPrefs[id] : options[id].def;
      document.getElementById(id)[options[id].attr] = val;
    });

    showHideDetails();
  });

  document.querySelector('#service').addEventListener('change', showHideDetails);
}

function showHideDetails() {
  // Show / hide details depending on service selection.
  let selected = document.querySelector('#service').value;

  ['googl', 'bitly', 'custom'].forEach(service => {
    document.querySelector('#' + service + '_details').style.display = (selected === service) ? 'block': 'none';
  });

  // Max canonical URL length makes no sense with no shortening service.
  document.querySelector('#always_shorten').style.display = (selected === 'none') ? 'none': 'block';
}

function saveOptions(e) {
  e.preventDefault();

  let toSave = {prefs: {}};
  Object.keys(options).forEach((id) => {
    toSave['prefs'][id] = document.getElementById(id)[options[id].attr];
  });
  browser.storage.local.set(toSave).then(() => {
    // Indicate that we saved succesfully.
    let saved = document.querySelector('#saved');

    saved.style.display = 'block';

    if (savedTimeout) {
      clearTimeout(savedTimeout);
    }
    savedTimeout = setTimeout(() => {
      saved.style.display = 'none';
      savedTimeout = null;
    }, 3000)
  });
}

document.addEventListener('DOMContentLoaded', init);
document.querySelector('form').addEventListener('submit', saveOptions);
