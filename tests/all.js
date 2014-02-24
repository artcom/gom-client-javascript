/* jshint expr: true */
/* globals define */

define([
  'gom-client',
  'intern!bdd',
  'intern/chai!expect'
], function (Gom, bdd, expect) {
  'use strict';

  var afterEach = bdd.afterEach,
      before = bdd.before,
      beforeEach = bdd.beforeEach,
      describe = bdd.describe,
      it = bdd.it;

  describe('GOM Client', function () {
    var gom,
        testNode = '/test/gom-client-javascript-' + Date.now(),
        testAttribute = testNode + ':attribute-' + Date.now();

    before(function () {
      gom = new Gom('http://gom.staging.t-gallery');
    });

    beforeEach(function () {
      return gom.update(testAttribute, 'initial');
    });

    afterEach(function () {
      return gom.destroy(testNode);
    });

    it('can retrieve attributes', function () {
      return gom.retrieve(testAttribute).then(function (result) {
        expect(result.attribute.value).to.equal('initial');
      });
    });

    it('can update attributes', function () {
      return gom.update(testAttribute, 'updated').then(function () {
        return gom.retrieve(testAttribute);
      }).then(function (result) {
        expect(result.attribute.value).to.equal('updated');
      });
    });

    it('can destroy attributes', function () {
      var deferred = this.async();

      gom.destroy(testAttribute).then(function () {
        return gom.retrieve(testAttribute);
      }).then(function () {
        // Retrieve is expected to fail, see below.
        deferred.reject();
      }).catch(deferred.callback(function (error) {
        expect(error.xhr.status).to.equal(404);
      }));
    });

    it('can retrieve nodes', function () {
      return gom.retrieve(testNode).then(function (result) {
        expect(result.node.uri).to.equal(testNode);

        var entries = result.node.entries;
        expect(entries).to.have.length(1);

        expect(entries[0].attribute.node).to.equal(testNode);
        expect(entries[0].attribute.value).to.equal('initial');
      });
    });

    it('can update nodes', function () {
      var attributes = {
        foo: 'bar',
        spam: 'eggs'
      };

      return gom.update(testNode, attributes).then(function () {
        return gom.retrieve(testNode);
      }).then(function (result) {
        expect(result.node.uri).to.equal(testNode);

        var entries = result.node.entries;
        expect(entries).to.have.length(3);

        expect(entries[1].attribute.node).to.equal(testNode);
        expect(entries[1].attribute.name).to.equal('foo');
        expect(entries[1].attribute.value).to.equal('bar');
        expect(entries[2].attribute.node).to.equal(testNode);
        expect(entries[2].attribute.name).to.equal('spam');
        expect(entries[2].attribute.value).to.equal('eggs');
      });
    });
  });
});
