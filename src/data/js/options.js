const options = {
  service: {
    attr: 'value',
    def: 'isgd'
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
  }
}

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
  });
}

function saveOptions(e) {
  e.preventDefault();

  let toSave = {prefs: {}};
  Object.keys(options).forEach((id) => {
    toSave['prefs'][id] = document.getElementById(id)[options[id].attr];
  });
  browser.storage.local.set(toSave);
}

document.addEventListener('DOMContentLoaded', init);
document.querySelector('form').addEventListener('submit', saveOptions);
