Intro and Installation
======================
This is a Firefox add-on built with the `Jetpack SDK
<https://jetpack.mozillalabs.com/>`_.

On any webpage, this jetpack adds a new item in the right click menu called
“copy short URL”. One can also add a clickable item to the
toolbar (right click on the tool bar and select "Customize..."). Upon
clicking either, the add-on looks for a canonical short URL exposed in the
page header. One can also active the creation of a short URL by using the
keyboard shortcut, `Ctrl+Shift+L`.

Currently, a number of major websites
expose their own short URLs for any entry on their webpages, among these:

* youtube (“youtu.be/…”),
* flickr (“flic.kr/…”),
* wordpress.com (“wp.me/…”),
* Arstechnica (“arst.ch/…”),
* Techcrunch (“wp.me/…”),

and many more.

If, however, the site does not name its own short URL, the add-on
automatically falls back to making a short URL using a URL shortening service
(by default: is.gd -- see :doc:`/serviceurl` for how to change that).

Either way, after a fraction of a second, you end up with a short URL in your
clipboard, ready to be used in forum posts, tweets, or wherever else you
please.


Installation
------------
The newest stable version of Copy ShortURL is always available on `Mozilla
Add-ons <https://addons.mozilla.org/en-US/firefox/addon/197224/>`_ and can be
installed directly from there.

If you want to use a development version, you'll need to check out the code
form `github <http://github.com/fwenzel/copy-shorturl/>`_ and build it. Refer
to the `Jetpack SDK Docs <https://jetpack.mozillalabs.com/sdk/0.7/docs/>`_ to
find out how.


Dependencies
------------
* `Jetpack <https://jetpack.mozillalabs.com/>`_ SDK 0.9
