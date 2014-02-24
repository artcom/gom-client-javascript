/* globals define */

define([
  'http-as-promised'
], function (http) {
  'use strict';

  var Gom = function (theHost) {
    this._host = theHost;
  };

  Gom.SCRIPT_RUNNER_PATH = '/gom/script-runner';

  /////////////////////
  // Private Members //
  /////////////////////

  Gom.prototype._send = function (method, path, options) {
    var url = this._host + path + '?format=json';
    return http.send(method, url, options);
  };

  Gom.prototype._getRequest = function (path, options) {
    return this._send('GET', path, options);
  };

  Gom.prototype._deleteRequest = function (path, options) {
    return this._send('DELETE', path, options);
  };

  Gom.prototype._putRequest = function (path, options) {
    return this._send('PUT', path, options);
  };

  Gom.prototype._postRequest = function (path, options) {
    // theOpts.headers = { "X-Requested-With": "XMLHttpRequest" };
    return this._send('POST', path, options);
  };

  Gom.prototype._writePayload = function (theAttributes) {
    var payload = '<?xml version="1.0" encoding="UTF-8"?><node>';
    for (var attrName in theAttributes) {
      payload += '<attribute name="' + attrName + '">';
      payload += '<![CDATA[' + theAttributes[attrName] + ']]>';
      payload += '</attribute>';
    }
    payload += '</node>';

    return payload;
  };

  Gom.prototype._validateOpts = function (theOpts) {
    theOpts = theOpts || {};

    return theOpts;
  };

  Gom.prototype._addJSONParseOnSuccess = function (theOpts) {
    // parse and deliver as JSON object

    var originalSuccess = theOpts.success;
    if(originalSuccess) {
      theOpts.success = function(data, code, xhr) {
        // if the content type starts with 'application/json'
        var contentType = xhr.getResponseHeader('Content-Type') || '';
        if(contentType.indexOf('application/json') === 0) {
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

  Gom.prototype.runScript= function(theScript, theOpts) {
    var myOpts = this._validateOpts(theOpts);
    myOpts.body = theScript;
    myOpts.headers = {
      'Content-Type': 'text/javascript'
    };

    this._addJSONParseOnSuccess(myOpts);
    return this._postRequest(Gom.SCRIPT_RUNNER_PATH, myOpts);
  };

  Gom.prototype.create = function(thePath, theOpts) {
    var myOpts = this._validateOpts(theOpts);

    // prepare attributes
    if ('attributes' in myOpts) {
      myOpts.body = this._writePayload(myOpts.attributes);
      myOpts.headers = {
        'Content-Type': 'application/xml'
      };
    }

    this._setRedirectHandling(myOpts);
    return this._postRequest(thePath, myOpts);
  };

  Gom.prototype.retrieve = function(thePath, theOpts) {
    var myOpts = this._validateOpts(theOpts);
    this._addJSONParseOnSuccess(myOpts);

    return this._getRequest(thePath, myOpts);
  };

  Gom.prototype.update = function (thePath, theValue, theOpts) {
    var payload;
    if ((thePath.indexOf(':') >= 0)) { // isAttribute
      payload = '<?xml version="1.0" encoding="UTF-8"?>';
      payload += '<attribute type="string">';
      payload += '<![CDATA[' + theValue + ']]>';
      payload += '</attribute>';
    } else {
      payload = this._writePayload(theValue);
    }

    var myOpts = this._validateOpts(theOpts);
    myOpts.body = payload;
    myOpts.headers = {
      'Content-Type': 'application/xml'
    };

    return this._putRequest(thePath, myOpts);
  };

  Gom.prototype.destroy = function (thePath, theOpts) {
    var myOpts = this._validateOpts(theOpts);

    return this._deleteRequest(thePath, myOpts);
  };

  Gom.prototype.determineIpAddress = function (theCallbacks) {
    return this.retrieve('/gom/config/connection', theCallbacks);
  };

  return Gom;
});
