/* globals define, Promise */

define(function () {
  'use strict';

  var http = {};

  http.sendXhr = function (method, url, options) {
    options = options || {};

    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url);

      xhr.onload = function() {
        var successful =
          xhr.status >= 200 && xhr.status < 300 ||
          xhr.status === 304;

        if (successful) {
          resolve(xhr);
        }
        else {
          var error = new Error(xhr.statusText);
          error.xhr = xhr;

          reject(error);
        }
      };

      xhr.onerror = function() {
        reject(new Error('Network Error'));
      };

      addHeaders(xhr, options.headers);

      if (options.body) {
        xhr.send(options.body);
      } else {
        xhr.send();
      }
    });
  };

  function addHeaders(xhr, headers) {
    if (typeof(headers) === 'object') {
      for (var header in headers) {
        if (headers.hasOwnProperty(header)) {
          xhr.setRequestHeader(header, headers[header]);
        }
      }
    }
  }

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
