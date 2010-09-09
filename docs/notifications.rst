Notification Styles
===================

By default, the add-on uses `Growl <http://growl.info/>`_ notifications, with
a fallback to a standard Firefox notification box in case Growl is not present.

If you prefer to change this behavior, or even want to switch off
notifications altogether, there's an option you can set. In ``about:config``,
set the setting ``extensions.copyshorturl.notifications`` to:

* ``0``: Switches off notifications altogether
* ``1``: Always uses a standard notification bar
* ``2``: Uses Growl if present, a notification bar otherwise. *(default)*
