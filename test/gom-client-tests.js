/* global afterEach, before, beforeEach, describe, it */

'use strict';

var Gom = require('../gom-client'),
    expect = require('chai').expect;

describe('GOM Client', function () {
  var gom,
      testNode = '/test/gom-client-javascript-' + Date.now(),
      testAttribute = testNode + ':attribute-' + Date.now();

  before(function () {
    gom = new Gom('http://192.168.56.101:3080/');
  });

  beforeEach(function () {
    return gom.update(testAttribute, 'initial');
  });

  afterEach(function () {
    return gom.destroy(testNode);
  });

  describe('Attributes', function () {
    it('can check if an attribute exists', function () {
      return gom.exists(testAttribute).then(function (exists) {
        expect(exists).to.be.true();
      });
    });

    it('can check if an attribute does not exist', function () {
      return gom.exists(testNode + ':does-not-exist').then(function (exists) {
        expect(exists).to.be.false();
      });
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
      return gom.destroy(testAttribute).then(function () {
        return gom.exists(testAttribute);
      }).then(function (exists) {
        expect(exists).to.equal(false);
      });
    });

    it('does not fail when destroying inexistent attribute', function () {
      return gom.destroy(testNode + ':does-not-exist');
    });
  });

  describe('Nodes', function () {
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

    it('can destroy nodes', function () {
      return gom.destroy(testNode).then(function () {
        return gom.exists(testNode);
      }).then(function (exists) {
        expect(exists).to.be.false();
      });
    });
  });

  describe('Scripts', function () {
    it ('can run scripts', function () {
      var scriptResult = 'SCRIPT_RESULT';
      var script = ['response.body = "' + scriptResult + '";',
                    'response.content_type = "text/plain"',
                    '"200 OK"'].join('\n');

      return gom.runScript(script).then(function (result) {
        expect(result).to.equal(scriptResult);
      });
    });
  });
});
