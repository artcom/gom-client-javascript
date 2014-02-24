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

  Gom.prototype._url = function (path) {
    return this._host + path + '?format=json';
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

  ////////////////////
  // Public Methods //
  ////////////////////

  Gom.prototype.runScript = function(script) {
    return http.post(this._url(Gom.SCRIPT_RUNNER_PATH), {
      body: script,
      headers: { 'Content-Type': 'text/javascript' }
    });
  };

  Gom.prototype.retrieve = function(path) {
    return http.get(this._url(path));
  };

  Gom.prototype.update = function (path, value) {
    var payload;
    if ((path.indexOf(':') >= 0)) { // isAttribute
      payload = '<?xml version="1.0" encoding="UTF-8"?>';
      payload += '<attribute type="string">';
      payload += '<![CDATA[' + value + ']]>';
      payload += '</attribute>';
    } else {
      payload = this._writePayload(value);
    }

    return http.put(this._url(path), {
      body: payload,
      headers: { 'Content-Type': 'application/xml' }
    });
  };

  Gom.prototype.destroy = function (path) {
    return http.delete(this._url(path)).catch(function (error) {
      if (error.xhr.status !== 404) {
        throw error;
      }
    });
  };

  Gom.prototype.determineIpAddress = function () {
    return this.retrieve('/gom/config/connection');
  };

  return Gom;
});
