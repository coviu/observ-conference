var test = require('tape');
var ObservConference = require('..');
var messenger = require('./helpers/messenger');
var signaller = require('rtc-signaller');
var roomId = require('uuid').v4();
var signallers = [];
var conference;

test('can create a new signalling instance', function(t) {
  t.plan(1);
  signallers[0] = signaller(messenger);
  signallers[0].once('connected', t.pass.bind(t, 'connected'));
});

test('can create an observable conference instance', function(t) {
  t.plan(1);
  conference = ObservConference(signallers[0]);
  t.ok(conference && typeof conference == 'function', 'created ok');
});

test('get a state update when we announce ourselves', function(t) {
  t.plan(2);
  var stop = conference(function(data) {
    t.equal(data.length, 1);
    t.equal(data[0].username, 'Fred');
    stop();
  });

  signallers[0].announce({ room: roomId, username: 'Fred' });
});

test('create another signaller', function(t) {
  t.plan(1);

  var stop = conference(function(data) {
    t.equal(data.length, 2);
    stop();
  });

  signallers[1] = signaller(messenger);
  signallers[1].announce({ room: roomId, username: 'Bob' });
});

test('update signaller:1 details', function(t) {
  t.plan(1);

  var stop = conference(function(data) {
    t.equal(data.length, 2);
    stop();
  });

  signallers[1].announce({ room: roomId, username: 'Tim' });
});

test('update signaller:1 details with no change contains an empty diff', function(t) {
  t.plan(2);

  var stop = conference(function(data) {
    t.deepEqual(data._diff, []);
    t.equal(data.length, 2);
    stop();
  });

  signallers[1].announce({ room: roomId, username: 'Tim' });
});

test('we can locate a participant by id', function(t) {
  var found;

  t.plan(1);
  found = conference.findById(signallers[1].id);
  t.ok(found && found.username() === 'Tim', 'found');
});

test('close signallers', function(t) {
  t.plan(signallers.length);
  signallers.splice(0).forEach(function(s) {
    s.once('disconnected', t.pass);
    s.leave();
  });
});
