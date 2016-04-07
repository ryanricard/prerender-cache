module.exports.calculateExpiration = function calculateExpiration(date, ttl) {
  date.setSeconds(date.getSeconds() + ttl);
  return date;
};