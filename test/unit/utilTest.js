var expect = require('chai').expect;
var util = require('../../plugin/util');

describe('Util', function() {
  describe('calculateExpiration()', function() {
    it('should calculate correct expiration date for ttl', function() {
      var ttl = 864000;
      var date1 = new Date(2016, 0, 0, 0, 0, 0);
      var date2 = new Date(2016, 0, 0, 0, 0, ttl);

      var result = util.calculateExpiration(date1, ttl);

      expect(result).to.eql(date2);
    });
  });
});