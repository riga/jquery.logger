# jQuery.Logger (v0.3.0)

A simple but powerful logging plugin for jQuery.


## Examples

##### Create a (global) logger and log something:

```javascript
var logger = $.Logger();

/**
 * simply log something
 */
logger.debug("my first log");
// => [2015-03-16 14:38:55.817] DEBUG - global - my first log

/*
 * disable, log and enable again
 */
logger.disable();
logger.debug("another log");
// nothing happens
logger.enable();

/**
 * set the level
 */
logger.level("info");
logger.debug("foo bar");
// nothing happens
logger.info("but this time");
// => [2015-03-16 14:38:56.193] INFO - global - but this time


/**
 * show name and namespace
 */
logger.name();
// => "global"
logger.namespace();
// => "global";
```


##### Create a child logger:

```javascript
var myLogger = $.Logger("foo");

/**
 * simply log something
 */
myLogger.info("foo's first log");
// => [2015-03-16 14:38:56.602] INFO - foo - foo's first log


/**
 * show parentage using the (global) logger defined above
 */
myLogger.parent() == logger;
// => true

// logger.child("foo") == myLogger;
// => true

```


##### Configuration

```javascript
// configure $.Logger _before_ you create any logger instance
// (these are the default options)
$.Logger({
  // name of the global namespace
  global: "global",

  // delimitter that seperates namespaces
  delimitter: ".",

  // use appropriate console logging methods instead of the standard log method,
  consoleMethods: true,

  // use timestamps in logs
  timestamps: true,

  // experimental
  // show file name and line number of the origin
  origin: true
});
```


## API

* **`$.Logger([namespace|options])`**
    > If `options` are passed, the logger options are extended and the `$.Logger` object is returned. If a `namespace` is passed, a new logger instance with that namespace is created and returned. When no argument is given, the global logger is returned. Logger parentage is built automatically. A namespace consists of a number of logger names seperated by a delimitter. Example: namespace `"foo.bar"` => logger `"global"` -> logger `"foo"` -> logger `"bar"`. **Note** that the global namespace (`"global"` in this example) is always prepended.

* `namespace()`
    > Returns the `namespace`.
    
* `name()`
    > Returns the `name`.
    
* `parent()`
    > Returns the parent logger, or `null` when invoked on the global logger.

* `children()`
    > Return all child loggers mapped to their names.

* `child(name)`
    > Return a child logger given by `name`.

* `enabled()`
    > Returns the state of the logger.

* `enable()`
    > Enable the logger and all its child loggers.

* `disable()`
    > Disable this and all its child loggers.

* `level([level])`
    > When `level` is given, sets the log level to that value. Possible values: `"all"`, `"debug"`, `"info"`, `"warning"`, `"error"`, `"fatal"`. When no argument is passed, the current log level is returned.

* `levels()`
    > Returns all valid log levels mapped to their numerical representation.

* `options()`
    > Returns the current options.

* `log(level, ...)`
    > Log `arguments` with a given `level`.

* `all | debug | info | warning | error | fatal(...)`
    > Shorthands that wrap around `log` for specific levels.



# Development

- Source hosted at [GitHub](https://github.com/riga/jquery.logger)
- Report issues, questions, feature requests on
[GitHub Issues](https://github.com/riga/jquery.logger/issues)


# Authors

Marcel R. ([riga](https://github.com/riga))