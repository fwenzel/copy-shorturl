Copy ShortURL Add-on
====================
by Fred Wenzel ``<fwenzel@mozilla.com>``

This is a Firefox add-on built with the Jetpack SDK.

On any webpage, this jetpack adds a new item in the right click menu called
“copy short URL”. When you click it, the add-on looks for a canonical short
URL exposed in the page header. Currently, a number of major websites
expose their own short URLs for any entry on their webpages, among these:

* youtube (“youtu.be/…”),
* flickr (“flic.kr/…”),
* wordpress.com,
* Arstechnica,
* Techcrunch,

and many more.

If, however, the site does not name its own short URL, the add-on
automatically falls back to making a short URL using a URL shortening service
(by default: is.gd -- see below).

Either way, after a fraction of a second, you end up with a short URL in your
clipboard, ready to be used in forum posts, tweets, or wherever else you
please.

Using a custom short URL service
--------------------------------
By default, Copy ShortURL falls back to the URL shortening service is.gd. If
you want to use a different service, you can define the service URL yourself.
To do that, enter ``about:config`` into the location bar, and edit the setting
``extensions.copyshorturl.serviceURL``.

When creating a new short URL, the add-on will request (GET) the URL you
specify here, while replacing the placeholder ``%URL%`` with the long URL that
it is trying to shorten. As a reply from the shortening service, it expects
a one-line, plain text document containing the shortened URL.

Examples:
* ``http://is.gd/api.php?longurl=%URL%`` (default) [(docs)][isgd]
* ``http://tinyurl.com/api-create.php?url=%URL%`` [(3rd party docs)][tiny]
* ``http://api.bit.ly/v3/shorten?format=txt&login=<login>&apiKey=<apiKey>&longUrl=%URL%`` [(docs)][bitly]
* ``http://yoursite.com/yourls-api.php?signature=<apikey>&action=shorturl&format=simple&url=%URL%`` [(docs)][yourls]

[bitly]: http://code.google.com/p/bitly-api/wiki/ApiDocumentation#/v3/shorten
[isgd]: http://is.gd/api_info.php
[tiny]: http://www.scripting.com/stories/2007/06/27/tinyurlHasAnApi.html
[yourls]: http://yourls.org/#API

Dependencies
------------
* [Jetpack][jetpack] SDK 0.7 (trunk)

[jetpack]: https://jetpack.mozillalabs.com/
