Using a custom short URL service
================================

By default, Copy ShortURL falls back to the URL shortening service is.gd. As I
am not affiliated with is.gd however, I wanted to make it easy for people to
use whatever service they like.

You may specify a different service by clicking "preferences" on Copy ShortURL
in the Firefox add-ons pane.

There, you can choose from default services or enter your own custom URL.

When creating a new short URL, the add-on will request (GET) the URL you
specify here, while replacing the placeholder ``%URL%`` with the long URL that
it is trying to shorten. As a reply from the shortening service, it expects
a one-line, plain text document containing the shortened URL.

Examples:

* ``http://is.gd/api.php?longurl=%URL%`` (default) `(docs)
  <http://is.gd/apishorteningreference.php>`__
* ``http://tinyurl.com/api-create.php?url=%URL%`` `(3rd party docs)
  <http://www.scripting.com/stories/2007/06/27/tinyurlHasAnApi.html>`__
* ``http://yoursite.com/yourls-api.php?signature=<apikey>&action=shorturl&format=simple&url=%URL%``
  `(docs) <http://yourls.org/#API>`__


bit.ly
------
Popular service bit.ly has a slighty more elaborate API. Create an
`OAuth access token <http://dev.bitly.com/authentication.html>`__, then enter
the following custom service URL into Copy ShortURL's settings:

``https://api-ssl.bitly.com/v3/shorten?format=txt&access_token=<accesstoken>&longUrl=%URL%``

Replace ``<accesstoken>`` in the URL with the token you created.

Full `bitly API docs <http://dev.bitly.com/api.html>`__ exist.
