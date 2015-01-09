'use strict';

var request = require('request-promise');

var Gom = module.exports = function (host) {
  this._host = host;
};

Gom.SCRIPT_RUNNER_PATH = '/gom/script-runner';

Gom.prototype.exists = function (path) {
  return request.get({
    url: this._url(path),
    simple: false,
    resolveWithFullResponse: true
  }).then(function (response) {
    return response.statusCode === 200;
  });
};

Gom.prototype.retrieve = function (path) {
  return request.get({
    url: this._url(path),
    json: true
  });
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

  return request.put({
    url: this._url(path),
    body: xml,
    headers: { 'Content-Type': 'application/xml' }
  });
};

Gom.prototype.destroy = function (path) {
  return request.del({
    url: this._url(path),
    json: true,
    simple: false
  }).then(function (result) {
    if (result.error && result.error.status !== 'not_found') {
      throw result.error;
    }
  });
};

Gom.prototype.runScript = function (script) {
  return request.post({
    url: this._url(Gom.SCRIPT_RUNNER_PATH),
    body: script,
    headers: { 'Content-Type': 'text/javascript' }
  });
};

Gom.prototype._url = function (path) {
  return this._host + path + '?format=json';
};
