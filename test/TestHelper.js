var AssertionHelper = require('./helpers/AssertionHelper');

afterEach(function() {
  AssertionHelper.check.call(this);
  AssertionHelper.reset.call(this);
});

module.exports.assert = AssertionHelper.assert;
module.exports.expect = AssertionHelper.expect;
module.exports.assertions = AssertionHelper.assertions;
