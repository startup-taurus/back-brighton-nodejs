const LRU = require('lru-cache');

const buckets = {
  authUser:  new LRU({ max: 500, maxAge: 60_000 }),
  authPerms: new LRU({ max: 50,  maxAge: 60_000 }),
};

module.exports = {
  get:      (bucket, key) => buckets[bucket]?.get(key),
  set:      (bucket, key, value) => buckets[bucket]?.set(key, value),
  has:      (bucket, key) => !!buckets[bucket]?.has(key),
  del:      (bucket, key) => buckets[bucket]?.del(key),
  reset:    (bucket) => buckets[bucket]?.reset(),
  resetAll: () => Object.values(buckets).forEach((c) => c.reset()),
};
