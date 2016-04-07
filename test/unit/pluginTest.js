describe('Plugin', function() {
  describe('beforePhantomRequest()', function() {
    it('should only warm cache for GET requests');
    it('should not query data store when warming header is received');
    it('should query data store warming header is not received');
    it('should return page from date store when found');
    it('should render page when page is not found in date store');
  });

  describe('afterPhantomRequest()', function() {
    it('should not filter requests with exclude conditions that evaluate to false');
    it('should filter requests with exclude conditions that evaluate to true');
  });
});