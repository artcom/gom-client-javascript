/* globals define, Promise */

define(function (require) {
  'use strict';

  require('es6-promise');

  var http = {};

  http.sendXhr = function (method, url, options) {
    options = options || {};

    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url);

      xhr.onreadystatechange = function() {
        if (this.readyState === this.DONE) {
          var successful =
            this.status >= 200 && this.status < 300 ||
            this.status === 304;

          if (successful) {
            resolve(this);
          }
          else {
            var error = new Error(this.statusText);
            error.xhr = this;

            reject(error);
          }
        }
      };

      xhr.onerror = function() {
        reject(new Error('Network Error'));
      };

      Object.keys(options.headers || {}).forEach(function (field) {
        xhr.setRequestHeader(field, options.headers[field]);
      });

      xhr.send(options.body || null);
    });
  };

  http.send = function (method, url, options) {
    return http.sendXhr(method, url, options).then(function (xhr) {
      if (isJsonResponse(xhr)) {
        return JSON.parse(xhr.response);
      } else {
        return xhr.response;
      }
    });
  };

  function isJsonResponse(xhr) {
    var contentType = xhr.getResponseHeader('Content-Type');
    return contentType && contentType.indexOf('application/json') === 0;
  }

  http.getXhr = http.sendXhr.bind(http, 'GET');
  http.putXhr = http.sendXhr.bind(http, 'PUT');
  http.postXhr = http.sendXhr.bind(http, 'POST');
  http.deleteXhr = http.sendXhr.bind(http, 'DELETE');

  http.get = http.send.bind(http, 'GET');
  http.put = http.send.bind(http, 'PUT');
  http.post = http.send.bind(http, 'POST');
  http.delete = http.send.bind(http, 'DELETE');

  return http;
});
