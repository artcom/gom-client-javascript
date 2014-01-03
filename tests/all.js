/* globals define */

define([
    "gom-client",
    "intern!bdd",
    "intern/chai!expect",
    "intern/order!../lib/y60inBrowser.js",
    "intern/order!../lib/logger.js"
], function (Gom, bdd, expect) {
    var afterEach = bdd.afterEach,
        before = bdd.before,
        beforeEach = bdd.beforeEach,
        describe = bdd.describe,
        it = bdd.it;

    describe("GOM Client", function () {
        var gom,
            testNode = "/test/gom-client-javascript-" + Date.now(),
            testAttribute = testNode + ":attribute-" + Date.now();

        before(function () {
            gom = new Gom("http://gom.staging.t-gallery");
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

        it("can retrieve attributes (legacy)", function () {
            var deferred = this.async(1000);

            return gom.retrieve(testAttribute, {
                success: deferred.callback(function (result) {
                    expect(result.attribute.value).to.equal("initial");
                }),
                error: function () {
                    deferred.reject();
                }
            });
        });
    });
});
