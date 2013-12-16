/* globals GOM_SERVER, use, Logger, Async.HttpClient, USER_AGENT, */
/* globals gomProxy, $, jQuery, document, netscape, alert, window */

/*
 * This gom-client is compatiable with Y60 and browser environments.
 * It supersedes the gom-client.js in cortex and gom.
 * When used in a browser context, be sure to also include
 *      * y60inBrowser
 *      * jQuery
 *      * jsgom2
 *
 * TODO: merge with Android gom-proxy
 *
 */

var Gom = (function (global) {
    "use strict";

    use("lib/json2.js");

    var Gom = function (theHost) {
        this._host = theHost;
    };

    Gom.SCRIPT_RUNNER_PATH = "/gom/script-runner";
    Gom.ENVIRONMENT = (function () {
        if (typeof(Async) !== "undefined") {
            return "Y60";
        } else if (typeof(jQuery) === "function") {
            return "jQuery";
        } else {
            return "unknown";
        }
    }());

    Gom.prototype.retrieve = function () {
    };

    return Gom;
}(this));


var GLOBALS = GLOBALS || this;

var gom = (function () {
    var _ = {};
    var that = {};

    // Environment Checks
    var Y60 = typeof(Async) !== "undefined";
    var JQ = typeof(jQuery) === "function";

    _.GOM_SCRIPT_RUNNER_PATH = "/gom/script-runner";
    
    /////////////////////
    // Private Members //
    /////////////////////

    _.send = function(theOpts) {
        if(Y60) {
            new Async.HttpClient(theOpts);
        }

        if(JQ) {
            // disable jQuerys automatic json parse in responses
            theOpts.processData = false;
            $.ajax(theOpts);
        }
    };

    _.server = function() {
        if(Y60) {
            return GLOBALS.host.gom_root;
        }

        if(JQ) {
            return window.host.gom_root;
        }
    };

    _.getRequest = function(thePath, theOpts) {
        theOpts.url = _.server() + thePath + "?format=json";
        theOpts.type = "GET";

        _.send(theOpts);
    };

    _.deleteRequest = function(thePath, theOpts) {
        theOpts.url = _.server() + thePath + "?format=json";
        theOpts.type = "DELETE";

        _.send(theOpts);
    };

    _.putRequest = function(thePath, theOpts) {
        theOpts.url = _.server() + thePath + "?format=json";
        theOpts.type = "PUT";

        _.send(theOpts);
    };

    _.postRequest = function(thePath, theOpts) {
        theOpts.url = _.server() + thePath + "?format=json";
        theOpts.type = "POST";

        theOpts.headers = { "X-Requested-With": "XMLHttpRequest" };

        _.send(theOpts);
    };

    // Wraps error handles to invoke 'success' in case of status 201 & 303 for post requests.
    _.setRedirectHandling = function(theOpts) {

        var originalSuccess = null;
        if ("success" in theOpts)
            originalSuccess = theOpts.success;

        var originalError = null;
        if ("error" in theOpts)
            originalError = theOpts.error;

        theOpts.success = function(data, code, xhr) {
            Logger.trace("_.setRedirectHandling error\n" + data + "\n" + typeof code + "\n" + xhr);

            if(((xhr.status === 201) || (xhr.status === 303)) && xhr.getResponseHeader("Location")) {
                if(originalSuccess) {
                    originalSuccess(xhr.getResponseHeader("Location"));
                }
            } else {
                if (originalError) {
                    originalError({ error_obj : xhr,
                        status    : xhr.status.toString()});
                }
            }
        };
    };

    _.writePayload = function(theInput) {
        var payload = "<?xml version='1.0' encoding='UTF-8'?><node>";
        for (var attrName in theInput) {
            payload += "<attribute name='" + attrName + "'><![CDATA[" + theInput[attrName] + "]]></attribute>";
        }
        payload += "</node>";

        return payload;
    };

    _.validateOpts = function (theOpts) {
        theOpts = theOpts || {};

        if (!("async" in theOpts)) {
            theOpts.async = true;
        }
        theOpts.async = !!theOpts.async;

        return theOpts;
    };

    _.addJSONParseOnSuccess = function (theOpts) {
        // parse and deliver as JSON object

        var originalSuccess = theOpts.success;
        if(originalSuccess) {
            theOpts.success = function(data, code, response) {
                //var contentType = response.getResponseHeader("Content-Type");

                // <<<< not good, re-think! 
                var contentType = "application/json";
                try{
                    contentType = response.getResponseHeader("Content-Type");
                }
                catch(ex){
                    Logger.info("--->>>>> The Response headers are undefined: " + ex);
                }
                // >>>>

                // if the content type starts with 'application/json'
                if(Y60)
                {
                    if(contentType.indexOf("application/json") === 0) {
                        originalSuccess(JSON.parse(data));
                    }
                    else {
                        originalSuccess(data);
                    }
                }
                else
                {
                    if(contentType.indexOf("application/json") === 0) {
                        originalSuccess(JSON.parse(response.responseText));
                    }
                    else {
                        originalSuccess(response.responseText);
                    }
                }
            };
        }
    };
    
    ////////////////////
    // Public Methods //
    ////////////////////        

    // theOpts['success'] : callback(json) is called upon success.
    // theOpts['error']   : callback(error_obj, status) is called upon error.
    // theOpts['async']   : bool (default: true) - determines if the request is performed asynchronously.
    // theOpts['params']  : object containing additional parameters for the script.
    // theScript          : The JavaScript script to be executed.
    that.run_script= function(theScript, theOpts) {
        Logger.trace("------> enter run_script");

        var myOpts = _.validateOpts(theOpts);
        myOpts.data = theScript;
        myOpts.contentType = "text/javascript";

        _.addJSONParseOnSuccess(myOpts);
        _.postRequest(_.GOM_SCRIPT_RUNNER_PATH, myOpts);
    };

    // theOpts['success'] : callback(json) is called upon success.
    // theOpts['error']   : callback(error_obj, status) is called upon error.
    // theOpts['async']   : bool (default: true) - determines if the request is performed asynchronously.
    that.create = function(thePath, theOpts) {
        var myOpts = _.validateOpts(theOpts);

        // prepare attributes
        var myAttributes = "";
        if ("attributes" in myOpts) {

            myOpts.data = _.writePayload(myOpts.attributes);
            myOpts.contentType = "application/xml";
        }

        _.setRedirectHandling(myOpts);
        _.postRequest(thePath, myOpts);
    };

    // theOpts['success'] : callback(json) is called upon success.
    // theOpts['error']   : callback(error_obj, status) is called upon error.
    // theOpts['async']   : bool (default: true) - determines if the request is performed asynchronously.
    that.retrieve = function(thePath, theOpts) {
        var myOpts = _.validateOpts(theOpts);
        _.addJSONParseOnSuccess(myOpts);

        _.getRequest(thePath, myOpts);
    };

    // theOpts['success'] : callback(json) is called upon success.
    // theOpts['error']   : callback(error_obj, status) is called upon error.
    // theOpts['async']   : bool (default: true) - determines if the request is performed asynchronously.
    that.update = function (thePath, theValue, theOpts) {
        var myPayload;
        if ((thePath.indexOf(":") >= 0)) { // isAttribute
            myPayload = '<?xml version="1.0" encoding="UTF-8"?><attribute type="string"><![CDATA[' + theValue + ']]></attribute>';
        } else {
            myPayload = _.writePayload(theValue);
        }

        var myOpts = _.validateOpts(theOpts);
        myOpts.data = myPayload;
        myOpts.contentType = "application/xml";

        _.putRequest(thePath, myOpts);
    };
        
    // theOpts['success'] : callback(json) is called upon success.
    // theOpts['error']   : callback(error_obj, status) is called upon error.
    // theOpts['async']   : bool (default: true) - determines if the request is performed asynchronously.
    that.destroy = function (thePath, theOpts) {
        var myOpts = _.validateOpts(theOpts);

        _.deleteRequest(thePath, myOpts);
    };

    // theOpts['success'] : callback(json) is called upon success.
    // theOpts['error']   : callback(error_obj, status) is called upon error.
    // theOpts['async']   : bool (default: true) - determines if the request is performed asynchronously.
    // theOpts['name']   : string (optional) - if a name is set a defined observer is updated or created, otherwise an observer will be created dynamically
    that.register_observer = function(thePath, theCallback_url, theOpts) {
        var myOpts = _.validateOpts(theOpts);

        // ensure format is set, default: application/json
        if (!("format" in myOpts)) {
            myOpts.format = "application/json";
        }
        myOpts.contentType = "application/json";

        var data = {callback_url: theCallback_url, accept: myOpts.format};

        if ("name" in myOpts) {
            // if a name exists update or create   
            var myPath = thePath.replace(":", "/");

            data.observer_uri = myPath;
            myOpts.data = JSON.stringify(data);
            that.update("/gom/observer" + myPath + "/." + myOpts.name, data, myOpts);
        }
        else {
            // if no name is set create an observer at a dynamicly given location
            myOpts.data = JSON.stringify(data);

            _.setRedirectHandling(myOpts);
            _.postRequest("/gom/observer" + thePath, myOpts);
        }
    };

    // theCallbacks['success']: callback(string) is called on success providing own address.
    // theCallbacks['error']   : callback(error_obj, status) is called upon error.
    that.determineIpAddress = function (theCallbacks) {
        that.retrieve("/gom/config/connection", theCallbacks);
    };

    /////////////////////
    // Utility methods //
    ///////////////////// 
    
    that.parseDate = function (dateString) {
        // gom delivers this:       "2009-08-18T18:24:39+02:00"
        // js can only parse this:  "2009/08/20 13:03:38 +0200"
        // so we have to cut & glue strings
        var parsableDate = dateString.substr(0, 10).replace(/-/g, "/") +
                           " " + dateString.substr(11, 8) + " ";
        dateString.substr(19, 6).replace(/:/, "");
        return new Date(Date.parse(parsableDate));
    };
    
    var pub = {
        retrieve   : that.retrieve,
        update     : that.update,
        destroy    : that.destroy,
        create     : that.create,
        register_observer : that.register_observer,
        run_script : that.run_script,
        parseTime  : that.parseDate,
        parseDate  : that.parseDate,
        determineIpAddress : that.determineIpAddress
    };
    
    return pub;
}());