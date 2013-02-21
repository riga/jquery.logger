/*!
 * jQuery Logging Plugin v0.1
 * https://github.com/riga/jquery.jqlog
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
    return this;
};

jQuery.jqlog = {

    _levels: {
        'all': 0,
        'debug': 2,
        'info': 4,
        'warning': 6,
        'error': 8,
        'fatal': 10
    },

    _enabled: false,

    _level: 'info',

    _canLog: function(level) {
        if(!level) {
            return this._enabled && window.console;
        } else {
            var validLevel = this._levels[level] >= this._levels[this._level];
            return this._enabled && window.console && validLevel;
        }
    },

    enable: function() {
        this._enabled = true;
        return this;
    },

    disable: function() {
        this._enabled = false;
        return this;
    },

    level: function(level) {
        if(!level) {
            return this._level;
        } else {
            if(this._levels[level] || this._levels[level] === 0) {
                this._level = level;
            }
        }
        return this;
    },

    _log: function(level, arguments) {
        arguments = jQuery.makeArray(arguments);
        if(this._canLog(level)) {
            arguments.unshift(this._prefix(level));
            window.console.log.apply(window.console, arguments);
        }
        return this;
    },

    _prefix: function(level) {
        var time = this._time();
        if(level) {
            return '[' + this._time() + '] ' + level.toUpperCase() + ' -';
        } else {
            return '[' + this._time() + ']';
        }
    },

    log: function() {
        this._log(null, arguments);
        return this;
    },

    debug: function() {
        this._log('debug', arguments);
        return this;
        return this;
    },

    info: function() {
        this._log('info', arguments);
        return this;
    },

    warn: function() {
        this._log('warning', arguments);
        return this;
    },

    error: function() {
        this._log('error', arguments);
        return this;
    },

    fatal: function() {
        this._log('fatal', arguments);
        return this;
    },

    _time: function() {
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
    }
};