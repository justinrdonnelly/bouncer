# Tests

These are just some fairly basic smoke tests for some of the lower level functionality.

**WARNING: The tests may modify your system!** Review the code before executing it.

Execute the tests with `gjs -m` (eg `gjs -m test/test-zoneInfo.js`). They generally just log information (there are no assertions). You'll probably have to view the tests to see what is supposed to happen.

To enable debug logging, set `G_MESSAGES_DEBUG` to `all` (eg `G_MESSAGES_DEBUG=all gjs -m test/test-zoneInfo.js`). You can use log domains to give finer control over what is logged at what level. See [here](https://docs.gtk.org/glib/logging.html#log-domains) for more details.
