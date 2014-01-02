/*jslint nomen: false*/
/*globals console window*/

var Logger = (function () {
    var that = {};
    var _    = {};
    
    that.FATAL   = 1;
    that.ERROR   = 2;
    that.WARNING = 3;
    that.INFO    = 4;
    that.DEBUG   = 5;
    that.TRACE   = 6;
    
    _.verbosity = that.WARNING;
    
    _.colors = {
        "TRACE" : {
            text : '#040404',
            background : '#eeeeee'
        },
        "DEBUG" : {
            text : '#040404',
            background : '#eeffee'
        }
    };
    
    _.prepareArguments = function (theArguments) {
        var my_arguments = Array.prototype.slice.call(theArguments); // Convert arguments to an Array
        return my_arguments;
    };
    
    _.getLevelPrefix = function (theLevelName) {
        return '[' + theLevelName + '] ';
    };
    
    _.augmentArgs = function (theArgs, theLevelName) {
        var myLevelName = _.getLevelPrefix(theLevelName);
        if (theArgs.length > 0 &&
            typeof(theArgs[0]) === 'string') {
            theArgs[0] = myLevelName + theArgs[0];
        } else {
            theArgs.unshift(myLevelName);
        }
        if (theLevelName in _.colors) {
            theArgs[0] = "%c" + theArgs[0];
            theArgs.splice(1, 0, 'color:' + _.colors[theLevelName].text + '; background-color:' + _.colors[theLevelName].background);
        }
        
    };
    
    _.logError = function (theArguments) {
        //console.exception.apply(console, theArguments);
        console.error.apply(console, theArguments);
        console.groupCollapsed("traceback");
        console.trace();
        console.groupEnd();
    };
    
    ////////////
    // Public //
    ////////////
    
    // fatal and error cannot be filtered
    that.filter = null;
    
    that.fatal = function () {
        if (typeof console !== "undefined" &&
            _.verbosity >= that.FATAL) {
            var my_arguments = _.prepareArguments(arguments);
            _.augmentArgs(my_arguments, "FATAL");
            _.logError(my_arguments);
        }
    };
    
    that.error = function () {
        if (typeof console !== "undefined" &&
            _.verbosity >= that.ERROR) {
            var my_arguments = _.prepareArguments(arguments);
            _.augmentArgs(my_arguments, "ERROR");
            _.logError(my_arguments);
        }
    };
    
    that.warn = function () {
        if (typeof console !== "undefined" &&
            _.verbosity >= that.WARNING) {
            var my_arguments = _.prepareArguments(arguments);
            if (typeof(that.filter) === 'function' &&
                that.filter(my_arguments, "WARN")) {
                return;
            }
            _.augmentArgs(my_arguments, "WARN");
            console.warn.apply(console, my_arguments);
        }
    };
    that.warning = that.warn; // compatible to y60-logger
    
    that.info = function () {
        if (typeof console !== "undefined" &&
            _.verbosity >= that.INFO) {
            var my_arguments = _.prepareArguments(arguments);
            if (typeof(that.filter) === 'function' &&
                that.filter(my_arguments, "INFO")) {
                return;
            }
            _.augmentArgs(my_arguments, "INFO");
            console.info.apply(console, my_arguments);
        }
    };
    
    that.debug = function () {
        if (typeof console !== "undefined" &&
            _.verbosity >= that.DEBUG) {
            var my_arguments = _.prepareArguments(arguments);
            if (typeof(that.filter) === 'function' &&
                that.filter(my_arguments, "DEBUG")) {
                return;
            }
            _.augmentArgs(my_arguments, "DEBUG");
            console.info.apply(console, my_arguments);
        }
    };
    
    that.trace = function () {
        if (typeof console !== "undefined" &&
            _.verbosity >= that.TRACE) {
            var my_arguments = _.prepareArguments(arguments);
            if (typeof(that.filter) === 'function' &&
                that.filter(my_arguments, "TRACE")) {
                return;
            }
            _.augmentArgs(my_arguments, "TRACE");
            console.info.apply(console, my_arguments);
        }
    };
    
    // also verbosity getter/setter?
    that.setVerbosity = function (theVerbosity) {
        _.verbosity = theVerbosity;
    };
    
    return that;
}());

var DEBUG_LEVELS = {
    'TRACE' : {value: 0, name: "trace"},
    'DEBUG' : {value: 1, name: "debug"},
    'INFO'  : {value: 2, name: "info"},
    'WARN'  : {value: 3, name: "warn"},
    'ERROR' : {value: 4, name: "error"},
    'FATAL' : {value: 5, name: "fatal"}
};

var DEBUG       = true;
var DEBUG_LEVEL = DEBUG_LEVELS.TRACE;

var debug_log = function (msg, level) {
    var my_level = DEBUG_LEVELS.INFO;
    if (level !== undefined) {
        my_level = level;
    }
    if ('DEBUG' in window &&
        DEBUG === true &&
        "console" in window) {
        
        if (my_level.value >= DEBUG_LEVEL.value) {
            if (my_level.value === DEBUG_LEVELS.ERROR.value) {
                if (typeof(msg) === 'object') {
                    console.log(my_level.name + " >>>");
                    console.error(msg);
                } else {
                    console.error(my_level.name + " > " + msg);
                }
            } else if (my_level.value === DEBUG_LEVELS.DEBUG.value) {
                if (typeof(msg) === 'object') {
                    console.log(my_level.name + " >>>");
                    console.debug(msg);
                } else {
                    console.debug(my_level.name + " > " + msg);
                }
            } else if (my_level.value === DEBUG_LEVELS.WARN.value) {
                if (typeof(msg) === 'object') {
                    console.log(my_level.name + " >>>");
                    console.warn(msg);
                } else {
                    console.warn(my_level.name + " > " + msg);
                }
            } else if (my_level.value === DEBUG_LEVELS.INFO.value) {
                if (typeof(msg) === 'object') {
                    console.log(my_level.name + " >>>");
                    console.info(msg);
                } else {
                    console.info(my_level.name + " > " + msg);
                }
            } else {
                if (typeof(msg) === 'object') {
                    console.log(my_level.name + " >>>");
                    console.log(msg);
                } else {
                    console.log(my_level.name + " > " + msg);
                }
            }
        }
    }
};