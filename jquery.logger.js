/*!
 * jQuery Logging Plugin v0.4.3
 * https://github.com/riga/jquery.logger
 *
 * Copyright 2015, Marcel Rieger
 * MIT licensed, http://www.opensource.org/licenses/mit-license
 *
 */

(function($) {

  /**
   * Store the global logger.
   */

  var globalLogger;


  /**
   * Default options.
   */

  var options = {
    // name of the global namespace
    global: "global",

    // delimitter that separates namespaces
    delimitter: ".",

    // use appropriate console logging methods instead of the standard log method,
    // the mapping is defined in `consoleMethods`
    useConsoleMethods: true,

    // show namespaces in logs
    showNamespace: true,

    // show timestamps in logs
    showTimestamp: true,

    // experimental
    // show file name and line number of the origin
    showOrigin: true,

    // experimental
    // cut query string from origin
    cutQuery: true
  };


  /**
   * Our levels.
   */

  var levels = {
    "all"    : 0,
    "debug"  : 10,
    "info"   : 20,
    "warning": 30,
    "error"  : 40,
    "fatal"  : 50
  };

  // the max string length of all levels
  var maxLevelLength = Math.max.apply(Math, Object.keys(levels).map(function(level) {
    return level.length;
  }));


  /**
   * Level -> console method mapping in case `useConsoleLevels` is true.
   */

  var consoleMethods = {
    "all"    : "log",
    "debug"  : "debug",
    "info"   : "info",
    "warning": "warn",
    "error"  : "error",
    "fatal"  : "error"
  };


  /**
   * Helper function that prefixes a namespace with the global namespace.
   *
   * @param {string} namespace - The namespace to prefix.
   * @returns {string}
   */
  var prefixNamespace = function(namespace) {
    var prefix = options.global + options.delimitter;

    if (namespace === undefined || namespace == options.global) {
      return options.global;
    } else if (namespace.indexOf(prefix) != 0) {
      return prefix + namespace;
    } else {
      return namespace;
    }
  };


  /**
   * Helper function that returns a specific logger for a given namespace.
   *
   * @param {string} namespace - Namespace of the logger 
   */
  var getLogger = function(namespace) {
    if (namespace === undefined) {
      return null;
    }

    // the global logger needs to be setup
    if (!globalLogger) {
      return null;
    }

    // prefix the namespace
    namespace = prefixNamespace(namespace);

    // split the namespace by our delimitter
    var parts = namespace.split(options.delimitter);

    // remove the global namespace
    parts.shift();

    // recursive lookup in each logger's subloggers
    var logger = globalLogger;
    while (parts.length) {
      logger = logger.children()[parts.shift()];

      // error case
      if (!logger) {
        break;
      }
    }

    return logger;
  };


  /**
   * Helper function that returns the name of a logger given its namespace.
   *
   * @param {string} namespace - The namespace of the logger.
   * @returns {string}
   */
  var getLoggerName = function(namespace) {
    if (namespace === undefined) {
      return null;
    }

    // prefix the namespace
    namespace = prefixNamespace(namespace);

    // the last part is the name
    return namespace.split(options.delimitter).pop();
  };


  /**
   * Helper function that creates a local timestamp with ms precision.
   *
   * @returns {string}
   */
  var timestamp = function() {
    var d = new Date();
    var s = "";

    s += d.getFullYear();
    s += "-";
    s += ("0" + d.getMonth()).slice(-2);
    s += "-";
    s += ("0" + d.getDate()).slice(-2);
    s += " ";
    s += ("0" + d.getHours()).slice(-2);
    s += ":";
    s += ("0" + d.getMinutes()).slice(-2);
    s += ":";
    s += ("0" + d.getSeconds()).slice(-2);
    s += ".";
    s += ("0" + d.getMilliseconds()).slice(-3);

    return s;
  };


  /**
   * Helper function that returns the file name and the line number of the code line that
   * invoked a log formatted as "file.js:line:col".
   * Experimental. Tested on Chrome 41.0.2272.118, FireFox 37.0.1 and Safari 8.0.5.
   *
   * @param {number} [offset=0] - Offset for finding the context that invoked the log. Due to the
   *  invocation queue of this plugin, we're normally interested in the 5th line of the stack that
   *  contains our protocol and host. If you want to shift that position, e.g. when logging a
   *  deprecation warning, use an offset of 1.
   * @returns {string|null}
   */
  var stackRE  = new RegExp(window.location.protocol + "//" + window.location.host);
  var originRE = new RegExp("^.*" + window.location.protocol + "//" + window.location.host
                            + ".+/([^/]+:\\d+:\\d+).*$");
  var queryRE  = new RegExp("^([^/]+)(\\?.*):\\d+:\\d+$");
  var getOrigin = function(offset) {
    // default offset
    if (offset === undefined) {
      offset = 0;
    }

    // create the stack
    var stack = String((new Error()).stack).split("\n").map(function(msg) {
      return msg.trim();
    });

    // filter to get the line of intereset
    var line = stack.filter(function(line, i) {
      return stackRE.test(line);
    })[4 + offset];

    if (!line) {
      return null;
    }

    // parse the line based on the format ".*protocol//host/path/file:line:local:*"
    var match = line.match(originRE);

    if (!match) {
      return null;
    }

    var origin = match[1];

    // cut query
    if (options.cutQuery) {
      match = origin.match(queryRE);

      if (match) {
        var l1 = match[1].length;
        var l2 = match[2].length;
        origin = match[0].substr(0, l1) + match[0].substr(l1 + l2);
      }
    }

    return origin;
  };


  /**
   * Logger definition.
   *
   * @param {string|object} [namespace=globalNamespace] - A string that defines the namespace of the
   *  new logger. In that case, the global namespace will be prefixed and the created logger is
   *  returned. When an object is passed, it is used to extend the default options and the main
   *  logger object is returned. Make sure to extend the options _before_ instantiating the first
   *  logger.
   * @returns {logger|Logger}
   */
  $.Logger = function(namespace) {

    // create logger or extend default options
    if ($.isPlainObject(namespace)) {
      $.extend(options, namespace);

      return $.Logger;
    }


    // prefix the global namespace
    namespace = prefixNamespace(namespace);


    // is there already a logger with that namespace?
    var self = getLogger(namespace);

    if (self) {
      return self;
    }

    // define a new logger
    self = {
      // current state
      _enabled: false,

      // current level
      _level: "all",

      // the namespace
      _namespace: namespace,

      // the name
      _name: getLoggerName(namespace),

      // parent logger
      _parent: null,

      // child loggers
      _children: {},

      // experimental
      // offset the for the origin determination of the next log
      _originOffset: 0,

      // name getter
      name: function() {
        return self._name;
      },

      // namespace getter
      namespace: function() {
        return self._namespace;
      },

      // parent getter
      parent: function() {
        return self._parent;
      },

      // children getter
      children: function() {
        return self._children;
      },

      // specific child getter
      child: function(name) {
        return self._children[name] || null;
      },

      // enabled getter
      enabled: function() {
        return self._enabled;
      },

      // enabled setters
      enable: function() {
        self._enabled = true;

        // enable all child loggers as well
        $.each(self._children, function(_, child) {
          child.enable();
        });

        return self;
      },

      disable: function() {
        self._enabled = false;

        // disable all child loggers as well
        $.each(self._children, function(_, child) {
          child.disable();
        });

        return self;
      },

      // level getter/setter
      level: function(level) {
        if (level === undefined) {
          // getter
          return self._level;

        } else {
          // setter
          level = level.toLowerCase();

          if (level in levels) {
            self._level = level;
          }
        }

        return self;
      },

      // experimental
      // origin offset getter/setter
      originOffset: function(offset) {
        if (offset === undefined) {
          // getter
          return self._originOffset;

        } else {
          // setter
          self._originOffset = offset;
        }

        return self;
      },

      // creates the prefix for all logs (timestamp, level and namespace)
      _prefix: function(level) {
        var prefix = "";

        // timestamp
        if (options.showTimestamp) {
          prefix += "[" + timestamp() + "] ";
        }

        // level
        prefix += level.toUpperCase();

        // namespace w/o global namespace
        if (options.showNamespace) {
          var namespace = self.namespace();
          if (self != globalLogger) {
            namespace = namespace.substr(options.global.length + options.delimitter.length);
          }
          prefix += " - " + namespace;
        }

        return prefix + " -";
      },

      // creates the postfix for all logs (origin)
      _postfix: function() {
        var postfix = [];

        // origin
        if (options.showOrigin) {
          var origin = getOrigin(self._originOffset);
          if (origin != null) {
            postfix.push(origin);
          }
        }

        return postfix.length ? "(" + postfix.join(", ") + ")" : "";
      },

      // checks whether a log is shown or not
      _canLog: function(level) {
        if (!window.console || level === undefined || !self.enabled()) {
          return false;
        }

        level = level.toLowerCase();

        if (!(level in levels)) {
          return false;
        }

        return levels[level] >= levels[self.level()];
      },

      // actual log method, should not be invoked directly as some features would fail,
      // e.g. line numbers
      _log: function(level, arguments) {
        if (!self._canLog(level)) {
          return self;
        }

        var args = Array.prototype.slice.call(arguments);

        // add prefix and postfix
        var prefix  = self._prefix(level);
        var postfix = self._postfix();

        if (args.length == 0) {
          args.push(prefix);
        } else {
          args[0] = prefix + " " + args[0];
        }
        args.push(postfix);

        // determine the log method to use
        var method = "log";
        if (options.useConsoleMethods) {
          var consoleMethod = consoleMethods[level.toLowerCase()];

          if (consoleMethod in window.console) {
            method = consoleMethod;
          }
        }

        // log
        window.console[method].apply(window.console, args);

        // experimental
        // set the origin offset to 0
        self._originOffset = 0;

        return self;
      },

      // wrapper around _log that should be used instead
      log: function(level) {
        var args = Array.prototype.slice.call(arguments, 1);

        return self._log(level, args);
      },

      // options getter
      options: function() {
        return options;
      },

      // levels getter
      levels: function() {
        return levels;
      }
    };


    /**
     * Add wrappers for all our levels.
     */

    $.each(levels, function(level) {
      var fn = self[level] = function() {
        return self._log.call(self, level, arguments);
      };

      // create a custom "bind" function that does the same as the original one
      // but also updates the origin offset
      fn._bind = fn.bind;

      fn.bind = function(thisArg) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function() {
          args.push.apply(args, Array.prototype.slice.call(arguments));
          self.originOffset(1);
          fn.apply(thisArg, args);
        };
      };
    });


    /**
     * Store the new logger.
     */

    if (namespace == options.global) {
      globalLogger = self;

      // the global logger is enabled by default
      self.enable();

    } else {
      // find the proper parent logger
      var parts = namespace.split(options.delimitter);
      parts.pop();
      var parentNamespace = parts.join(options.delimitter);
      self._parent = getLogger(parentNamespace);

      // create if it does not exist yet
      if (!self._parent) {
        self._parent = $.Logger(parentNamespace);
      }

      // add self to _parent
      self._parent._children[self.name()] = self;

      // enable if _parent is also enabled
      if (self._parent.enabled()) {
        self.enable();
      }

      // adapt the parent's level
      self.level(self._parent.level());
    }


    /**
     * Return the created shortcuts.
     */

    return self;
  };


  /**
   * Additional log function for jQuery nodes.
   *
   * @example
   * $("#myDiv").log();
   * @param {string} [msg] - A log message. 
   * @returns {this}
   */
  $.fn.log = function(msg) {
    if (window && window.console) {
      if (msg === undefined) {
        console.log("%o: %s", this, msg);
      } else {
        console.log(this);
      }
    }

    return this;
  };

})(jQuery);
