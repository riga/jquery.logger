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

var _loggers = {};
var _loggerNamespaces = {};

jQuery.Logger = function(namespace) {

    var global = 'global';
    var splitter = '.';
    namespace = namespace || global;
    namespace = namespace.indexOf(global) === 0 ? namespace : global + splitter + namespace;

    var self = _loggers[namespace];

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
        _canLog = function(level) {
            if(!level) {
                return enabled() && window.console;
            } else {
                var validLevel = _levels[level] >= _levels[_level];
                return _enabled && window.console && validLevel;
            }
        },
        _parentLogger = function() {
            var parts = namespace.split(splitter);
            parts.pop();
            return _loggers[parts.join(splitter)];
        },
        _subLoggers = function() {
            var loggers = [];
            jQuery.each(_loggers, function(key, logger) {
                if(key != namespace && key.indexOf(namespace) === 0) {
                    loggers.push(logger);
                }
            });
            return loggers;
        },
        enable = function() {
            _enabled = true;
            // enable all sub loggers
            jQuery.each(_subLoggers(), function(i, sublogger) {
                sublogger.enable();
            });
            return self;
        },
        disable = function() {
            _enabled = false;
            // disable all sub loggers
            jQuery.each(_subLoggers(), function(i, sublogger) {
                sublogger.disable();
            });
            return self;
        },
        enabled = function() {
            return _enabled;
        },
        level = function(level) {
            if(!level) {
                return _level;
            } else {
                if(_levels[level] || _levels[level] === 0) {
                    _level = level;
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
                logNamespace = namespace.replace(/global\./, '');
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
        _loggers[namespace] = self = {
            namespace: namespace,
            enable: enable,
            disable: disable,
            enabled: enabled,
            level: level,
            log: log,
            debug: debug,
            info: info,
            warn: warn,
            error: error,
            fatal: fatal
        };

        // update the namespaces
        var namespaces = _loggerNamespaces;
        jQuery.each(namespace.split(splitter), function(i, subspace) {
            if(!namespaces[subspace]) {
                namespaces[subspace] = {};
            }
            namespaces = namespaces[subspace];
        });

        // enable the new logger, when the parent
        // logger is enabled and apply its level
        var parentLogger = _parentLogger();
        if(parentLogger && parentLogger.enabled()) {
            enable();
            level(parentLogger.level());
        }

    }

    return self;
};