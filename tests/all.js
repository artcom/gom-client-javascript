/* globals after, afterEach, before, beforeEach, define, describe, GomClient, it */
/*  */

define([
    "gom-client",
    "intern!bdd",
    "intern/chai!expect",
    "intern/order!../lib/y60inBrowser.js",
    "intern/order!../lib/logger.js"
], function (Gom, bdd, expect, $) {
    with (bdd) {
        describe("GOM Client", function () {
            var gom,
                testNode = "/test/gom-client-javascript-" + Date.now(),
                testAttribute = testNode + ":attribute-" + Date.now();

            before(function () {
                gom = new Gom("http://192.168.56.101:3080");
            });

            beforeEach(function () {
                return gom.update(testAttribute, "initial");
            });

            afterEach(function () {
                return gom.destroy(testNode);
            });

            it("can retrieve attributes", function () {
                return gom.retrieve(testAttribute).then(function (result) {
                    expect(result.attribute.value).to.equal("initial");
                });
            });
        });
    }
});
