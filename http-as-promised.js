/* globals define, Promise */

define(function () {
  'use strict';

  var http = {};

  http.send = function (method, url, options) {
    options = options || {};

    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url);

      xhr.onload = function() {
        if (xhr.status === 200) {
          var response;

          if (isJsonResponse(xhr)) {
            response = JSON.parse(xhr.response);
          } else {
            response = xhr.response;
          }

          resolve(response, xhr.status, xhr);
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

  function isJsonResponse(xhr) {
    var contentType = xhr.getResponseHeader('Content-Type');
    return contentType && contentType.indexOf('application/json') === 0;
  }

  return http;
});
