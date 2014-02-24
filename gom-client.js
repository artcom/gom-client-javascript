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
    return this._send('POST', path, options);
  };

  Gom.prototype._initializeOptions = function (options) {
    options = options || {};
    options.headers = options.headers || {};
    return options;
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

  Gom.prototype.runScript = function(script, options) {
    options = this._initializeOptions(options);

    options.body = script;
    options.headers['Content-Type'] = 'text/javascript';

    return this._postRequest(Gom.SCRIPT_RUNNER_PATH, options);
  };

  Gom.prototype.create = function(path, options) {
    options = this._initializeOptions(options);

    options.headers['X-Requested-With'] = 'XMLHttpRequest';

    if (options.attributes) {
      options.body = this._writePayload(options.attributes);
      options.headers['Content-Type'] = 'application/xml';
    }

    return this._postRequest(path, options);
  };

  Gom.prototype.retrieve = function(path, options) {
    return this._getRequest(path, options);
  };

  Gom.prototype.update = function (path, value, options) {
    options = this._initializeOptions(options);

    var payload;
    if ((path.indexOf(':') >= 0)) { // isAttribute
      payload = '<?xml version="1.0" encoding="UTF-8"?>';
      payload += '<attribute type="string">';
      payload += '<![CDATA[' + value + ']]>';
      payload += '</attribute>';
    } else {
      payload = this._writePayload(value);
    }

    options.body = payload;
    options.headers['Content-Type'] = 'application/xml';

    return this._putRequest(path, options);
  };

  Gom.prototype.destroy = function (path, options) {
    return this._deleteRequest(path, options);
  };

  Gom.prototype.determineIpAddress = function () {
    return this.retrieve('/gom/config/connection');
  };

  return Gom;
});
