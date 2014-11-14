var server = require('./server');
var test = require('tape');

require('./all');

test('shutdown the server', function(t) {
  server.close();
  t.end();
});
