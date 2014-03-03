/* globals define */

define(function (require) {
  'use strict';

  var http = require('http-as-promised');

  var Gom = function (host) {
    this._host = host;
  };

  Gom.SCRIPT_RUNNER_PATH = '/gom/script-runner';

  /////////////////////
  // Private Members //
  /////////////////////

  Gom.prototype._url = function (path) {
    return this._host + path + '?format=json';
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
    var xml = '<?xml version="1.0" encoding="UTF-8"?>';

    if ((path.indexOf(':') >= 0)) {
      xml += '<attribute type="string"><![CDATA[' + value + ']]></attribute>';
    } else {
      xml += '<node>';

      for (var attribute in value) {
        xml += '<attribute name="' + attribute + '">';
        xml += '<![CDATA[' + value[attribute] + ']]>';
        xml += '</attribute>';
      }

      xml += '</node>';
    }

    return http.put(this._url(path), {
      body: xml,
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
