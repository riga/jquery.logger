/*!
 * jQuery Logging Plugin v0.2
 * https://github.com/riga/jquery.logger
 *
 * Copyright 2013, Marcel Rieger
 * Dual licensed under the MIT or GPL Version 3 licenses.
 * http://www.opensource.org/licenses/mit-license
 * http://www.opensource.org/licenses/GPL-3.0
 *
 */

jQuery.fn.log = function(msg) {
    if(window.console && window.console.log) {
        if(msg) {
            console.log('%o: %s', this, msg);
        } else {
            console.log(this);
        }
    }
    return self;
};


var _logger;
jQuery.Logger = function(namespace) {

    var global = 'global';
    var splitter = '.';
    namespace = namespace || global;
    namespace = namespace.indexOf(global) === 0 ? namespace : global + splitter + namespace;

    var getLogger = function(_namespace) {
        if(!_logger) {
            return _logger;
        }
        var parts = _namespace.split(splitter);
        // remove the 'global' part
        parts.shift();
        var logger = _logger;
        while(parts.length) {
            logger = logger.subLoggers()[parts.shift()];
            if(!logger) {
                break;
            }
        }
        return logger;
    };

    var getLoggerName = function(_namespace) {
        var parts = _namespace.split(splitter);
        if(!parts.length) {
            return null;
        } else {
            return parts.pop();
        }
    };

    var self = getLogger(namespace);

    if(!self) {
        var _levels = {
            'all': 0,
            'debug': 2,
            'info': 4,
            'warning': 6,
            'error': 8,
            'fatal': 10
        },
        _enabled = false,
        _level = 'info',
        _supLogger = null,
        _subLoggers = {},
        name = getLoggerName(namespace),
        _canLog = function(level) {
            if(!level) {
                return enabled() && window.console;
            } else {
                var validLevel = _levels[level] >= _levels[_level];
                return _enabled && window.console && validLevel;
            }
        },
        supLogger = function() {
            return _supLogger;
        },
        subLoggers = function() {
            return _subLoggers;
        },
        setSupLogger = function(logger) {
            _supLogger = logger;
            return self;
        },
        addSubLogger = function(logger) {
            _subLoggers[logger.name] = logger;
            return self;
        },
        enable = function() {
            _enabled = true;
            // enable all sub loggers
            jQuery.each(subLoggers(), function(i, sublogger) {
                sublogger.enable();
            });
            return self;
        },
        disable = function() {
            _enabled = false;
            // disable all sub loggers
            jQuery.each(subLoggers(), function(i, sublogger) {
                sublogger.disable();
            });
            return self;
        },
        enabled = function() {
            return _enabled;
        },
        level = function(__level) {
            if(!__level) {
                return _level;
            } else {
                if(_levels[__level] || _levels[__level] === 0) {
                    _level = __level;
                    // change the level of all subLoggers
                    jQuery.each(subLoggers(), function(i, sublogger) {
                        if(sublogger.level) {
                            sublogger.level(__level);
                        }
                    });
                }
            }
            return self;
        },
        _log = function(level, arguments) {
            arguments = jQuery.makeArray(arguments);
            if(_canLog(level)) {
                arguments.unshift(_prefix(level));
                window.console.log.apply(window.console, arguments);
            }
            return self;
        },
        _prefix = function(level) {
            var prefix = '[' + _time() + ']';
            // cut the 'global' string
            var logNamespace;
            if(namespace.indexOf(global) === 0 && namespace != global) {
                logNamespace = namespace.replace(new RegExp(global + '\\.'), '');
            }
            if(logNamespace) {
                prefix += ' ' + logNamespace + ' -';
            }
            if(level) {
                prefix += ' ' + level.toUpperCase() + ' -';
            }
            return prefix;
        },
        log = function() {
            _log(null, arguments);
            return self;
        },
        debug = function() {
            _log('debug', arguments);
            return self;
            return self;
        },
        info = function() {
            _log('info', arguments);
            return self;
        },
        warn = function() {
            _log('warning', arguments);
            return self;
        },
        error = function() {
            _log('error', arguments);
            return self;
        },
        fatal = function() {
            _log('fatal', arguments);
            return self;
        },
        _time = function() {
            var d = new Date();
            var timestring = d.toLocaleTimeString();
            var ms = d.getMilliseconds();
            if(ms < 10) {
                ms = '00' + String(ms);
            } else if(ms < 100) {
                ms = '0' + String(ms);
            } else {
                ms = String(ms);
            }
            return timestring + '.' + ms;
        };

        // create the logger object
        self = {
            namespace: namespace,
            name: name,
            enable: enable,
            disable: disable,
            enabled: enabled,
            level: level,
            supLogger: supLogger,
            subLoggers: subLoggers,
            setSupLogger: setSupLogger,
            addSubLogger: addSubLogger,
            log: log,
            debug: debug,
            info: info,
            warn: warn,
            error: error,
            fatal: fatal
        };

        // is there a supLogger for this namespace?
        if(namespace != global) {
            var parts = namespace.split(splitter);
            parts.pop();
            var supNamespace = parts.join(splitter);
            var _supLogger = getLogger(supNamespace);
            if(!_supLogger) {
                _supLogger = jQuery.Logger(supNamespace);
            }
            // add subLogger to _supLogger
            _supLogger.addSubLogger(self);
            // set supLogger of self
            setSupLogger(_supLogger);
            // enable self if _suplogger is enabled
            if(_supLogger.enabled()) {
                enable();
                level(_supLogger.level());
            }
        } else {
            // the logger is the global logger
            _logger = self;
        }

    }
    return self;
};