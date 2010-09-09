Using a custom short URL service
================================

By default, Copy ShortURL falls back to the URL shortening service is.gd. As I
am not affiliated with is.gd however, I wanted to make it easy for people to
use whatever service they like.

So if you want to use a different service, you can define the service URL
yourself. To do that, enter ``about:config`` into the location bar, and edit
the setting ``extensions.copyshorturl.serviceURL``.

When creating a new short URL, the add-on will request (GET) the URL you
specify here, while replacing the placeholder ``%URL%`` with the long URL that
it is trying to shorten. As a reply from the shortening service, it expects
a one-line, plain text document containing the shortened URL.

Examples:

* ``http://is.gd/api.php?longurl=%URL%`` (default) `(docs)
  <http://is.gd/api_info.php>`__
* ``http://tinyurl.com/api-create.php?url=%URL%`` `(3rd party docs)
  <http://www.scripting.com/stories/2007/06/27/tinyurlHasAnApi.html>`__
* ``http://api.bit.ly/v3/shorten?format=txt&login=<login>&apiKey=<apiKey>&longUrl=%URL%``
  `(docs) <http://code.google.com/p/bitly-api/wiki/ApiDocumentation#/v3/shorten>`__
* ``http://yoursite.com/yourls-api.php?signature=<apikey>&action=shorturl&format=simple&url=%URL%``
  `(docs) <http://yourls.org/#API>`__
