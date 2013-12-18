/* globals $, Async, jQuery, Logger, use */

/*
 * This gom-client is compatiable with Y60 and browser environments.
 * It supersedes the gom-client.js in cortex and gom.
 * When used in a browser context, be sure to also include
 *      * y60inBrowser
 *      * jQuery
 *      * jsgom2
 *
 */

(function (global) {
    "use strict";

    use("lib/json2.js");

    var Gom = function (theHost) {
        this._host = theHost;
    };

    Gom.SCRIPT_RUNNER_PATH = "/gom/script-runner";
    Gom.ENVIRONMENT = (function (){
        if (typeof(Async) !== "undefined") {
            return "y60";
        } else if (typeof(jQuery) === "function") {
            return "jQuery";
        } else {
            return "unknown";
        }
    }());


    /////////////////////
    // Private Members //
    /////////////////////

    Gom.prototype._send = function (theOpts) {
        if(Gom.ENVIRONMENT === "y60") {
            new Async.HttpClient(theOpts);
        }

        if(Gom.ENVIRONMENT === "jQuery") {
            $.ajax(theOpts);
        }
    };

    Gom.prototype._getRequest = function (thePath, theOpts) {
        theOpts.url = this._host + thePath + "?format=json";
        theOpts.type = "GET";

        this._send(theOpts);
    };

    Gom.prototype._deleteRequest = function (thePath, theOpts) {
        theOpts.url = this._host + thePath + "?format=json";
        theOpts.type = "DELETE";

        this._send(theOpts);
    };

    Gom.prototype._putRequest = function (thePath, theOpts) {
        theOpts.url = this._host + thePath + "?format=json";
        theOpts.type = "PUT";

        this._send(theOpts);
    };

    Gom.prototype._postRequest = function (thePath, theOpts) {
        theOpts.url = this._host + thePath + "?format=json";
        theOpts.type = "POST";

        theOpts.headers = { "X-Requested-With": "XMLHttpRequest" };

        this._send(theOpts);
    };


    Gom.prototype._setRedirectHandling = function (theOpts) {
        var originalSuccess = null;
        if ("success" in theOpts) {
            originalSuccess = theOpts.success;
        }

        var originalError = null;
        if ("error" in theOpts) {
            originalError = theOpts.error;
        }

        theOpts.success = function(data, code, xhr) {
            Logger.trace("_setRedirectHandling error\n" + data + "\n" + typeof code + "\n" + xhr);

            if(((xhr.status === 201) || (xhr.status === 303)) && xhr.getResponseHeader("Location")) {
                if(originalSuccess) {
                    originalSuccess(xhr.getResponseHeader("Location"));
                }
            } else {
                if (originalError) {
                    originalError(xhr, xhr.status.toString());
                }
            }
        };
    };

    Gom.prototype._writePayload = function (theAttributes) {
        var payload = "<?xml version='1.0' encoding='UTF-8'?><node>";
        for (var attrName in theAttributes) {
            payload += "<attribute name='" + attrName + "'><![CDATA[" + theAttributes[attrName] + "]]></attribute>";
        }
        payload += "</node>";

        return payload;
    };

    Gom.prototype._validateOpts = function (theOpts) {
        theOpts = theOpts || {};

        if (!("async" in theOpts)) {
            theOpts.async = true;
        }
        theOpts.async = !!theOpts.async;

        return theOpts;
    };

    Gom.prototype._addJSONParseOnSuccess = function (theOpts) {
        // parse and deliver as JSON object

        var originalSuccess = theOpts.success;
        if(originalSuccess) {
            theOpts.success = function(data, code, xhr) {
                // if the content type starts with 'application/json'
                var contentType = xhr.getResponseHeader("Content-Type") || "";
                if(contentType.indexOf("application/json") === 0) {
                    Logger.trace("_addJSONParseOnSuccess::parse");
                    originalSuccess(JSON.parse(xhr.responseText));
                }
                else {
                    originalSuccess(xhr.responseText);
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
    Gom.prototype.runScript= function(theScript, theOpts) {
        var myOpts = this._validateOpts(theOpts);
        myOpts.data = theScript;
        myOpts.contentType = "text/javascript";

        this._addJSONParseOnSuccess(myOpts);
        this._postRequest(Gom.SCRIPT_RUNNER_PATH, myOpts);
    };

    // theOpts['success'] : callback(json) is called upon success.
    // theOpts['error']   : callback(error_obj, status) is called upon error.
    // theOpts['async']   : bool (default: true) - determines if the request is performed asynchronously.
    Gom.prototype.create = function(thePath, theOpts) {
        var myOpts = this._validateOpts(theOpts);

        // prepare attributes
        if ("attributes" in myOpts) {
            myOpts.data = this._writePayload(myOpts.attributes);
            myOpts.contentType = "application/xml";
        }

        this._setRedirectHandling(myOpts);
        this._postRequest(thePath, myOpts);
    };

    // theOpts['success'] : callback(json) is called upon success.
    // theOpts['error']   : callback(error_obj, status) is called upon error.
    // theOpts['async']   : bool (default: true) - determines if the request is performed asynchronously.
    Gom.prototype.retrieve = function(thePath, theOpts) {
        var myOpts = this._validateOpts(theOpts);
        this._addJSONParseOnSuccess(myOpts);

        this._getRequest(thePath, myOpts);
    };

    // theOpts['success'] : callback(json) is called upon success.
    // theOpts['error']   : callback(error_obj, status) is called upon error.
    // theOpts['async']   : bool (default: true) - determines if the request is performed asynchronously.
    Gom.prototype.update = function (thePath, theValue, theOpts) {
        var myPayload;
        if ((thePath.indexOf(":") >= 0)) { // isAttribute
            myPayload = "<?xml version='1.0' encoding='UTF-8'?><attribute type='string'><![CDATA[" + theValue + "]]></attribute>";
        } else {
            myPayload = this._writePayload(theValue);
        }

        var myOpts = this._validateOpts(theOpts);
        myOpts.data = myPayload;
        myOpts.contentType = "application/xml";

        this._putRequest(thePath, myOpts);
    };

    // theOpts['success'] : callback(json) is called upon success.
    // theOpts['error']   : callback(error_obj, status) is called upon error.
    // theOpts['async']   : bool (default: true) - determines if the request is performed asynchronously.
    Gom.prototype.destroy = function (thePath, theOpts) {
        var myOpts = this._validateOpts(theOpts);

        this._deleteRequest(thePath, myOpts);
    };

    // theOpts['success'] : callback(json) is called upon success.
    // theOpts['error']   : callback(error_obj, status) is called upon error.
    // theOpts['async']   : bool (default: true) - determines if the request is performed asynchronously.
    // theOpts['name']   : string (optional) - if a name is set a defined observer is updated or created, otherwise an observer will be created dynamically
    Gom.prototype.registerObserver = function(thePath, theCallbackUrl, theOpts) {
        var myOpts = this._validateOpts(theOpts);

        // ensure format is set, default: application/json
        if (!("format" in myOpts)) {
            myOpts.format = "application/json";
        }
        myOpts.contentType = "application/json";

        var data = { callback_url: theCallbackUrl, accept: myOpts.format };

        if ("name" in myOpts) {
            // if a name exists update or create   
            var myPath = thePath.replace(":", "/");

            data.observer_uri = myPath;
            myOpts.data = JSON.stringify(data);
            this.update("/gom/observer" + myPath + "/." + myOpts.name, data, myOpts);
        }
        else {
            // if no name is set create an observer at a dynamicly given location
            myOpts.data = JSON.stringify(data);

            this._setRedirectHandling(myOpts);
            this._postRequest("/gom/observer" + thePath, myOpts);
        }
    };

    // theCallbacks['success']: callback(string) is called on success providing own address.
    // theCallbacks['error']   : callback(error_obj, status) is called upon error.
    Gom.prototype.determineIpAddress = function (theCallbacks) {
        this.retrieve("/gom/config/connection", theCallbacks);
    };

    /////////////////////
    // Utility methods //
    ///////////////////// 

    Gom.prototype.parseDate = function (dateString) {
        // gom delivers this:       "2009-08-18T18:24:39+02:00"
        // js can only parse this:  "2009/08/20 13:03:38 +0200"
        // so we have to cut & glue strings
        var parsableDate = dateString.substr(0, 10).replace(/-/g, "/") +
                           " " + dateString.substr(11, 8) + " ";
        dateString.substr(19, 6).replace(/:/, "");
        return new Date(Date.parse(parsableDate));
    };

    global.Gom = Gom;
}(this));
