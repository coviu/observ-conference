var Observ = require('observ');
var ObservArray = require('observ-array');
var ObservStruct = require('observ-struct');
var extend = require('cog/extend');

/**
  # observ-conference

  An experimental implementation of an
  [Observ](https://github.com/Raynos/Observ) that works with an
  [rtc-quickconnect](https://github.com/rtc-io/rtc-quickconnect) conference
  instance.

  ## Example Usage

  To be completed.

**/

module.exports = function(conference, opts) {
  var participants = ObservArray([]);

  function findById(id) {
    var idx = 0;
    var len = participants.getLength();
    while (idx < len && participants.get(idx).id() !== id) {
      idx++;
    }

    if (idx < len) {
      return participants.get(idx);
    }
  }

  function removePeer(id) {
    participants.transaction(function(raw) {
      var idx = 0;
      while (idx < raw.length && raw[idx].id() !== id) {
        idx++;
      }

      if (idx < raw.length) {
        raw.splice(idx, 1);
      }
    });
  }

  function streamAdd(id, stream) {
    var peer = findById(id);
    if (peer) {
      peer.streams.push(stream);
    }
  }

  function streamRemove(id) {
  }

  function updatePeer(id, data, connected) {
    var p = {
      id: id,
      streams: ObservArray([]),
      connected: Observ(connected)
    };

    participants.transaction(function(raw) {
      var idx = 0;
      var insertPeer = true;
      var keys = Object.keys(data);

      while (idx < raw.length && raw[idx].id() !== id) {
        idx++;
      }

      if (idx < raw.length) {
        insertPeer = keys.filter(function(key) {
          var ob = raw[idx][key];

          // if we don't have an observable for this attribute
          // throw away the object and start again
          if (typeof ob != 'function') {
            return false;
          }

          if (ob() !== data[key]) {
            ob.set(data[key]);
          }

          return true;
        }).length !== keys.length;

        // toggle the connection state
        if (connected || raw[idx].connected()) {
          p.connected.set(true);
          raw[idx].connected.set(true);
        }

        if (insertPeer) {
          raw.splice(idx, 1);
        }
      }

      if (insertPeer) {
        keys.forEach(function(key) {
          p[key] = Observ(data[key]);
        });

        raw.push(ObservStruct(p));
      }

      raw.sort(function(a, b) {
        return a.id().localeCompare(b.id());
      });
    });
  }

  conference.on('local:announce', function(data) {
    updatePeer(data.id, extend({ local: true }, data), true);
  });

  conference.on('peer:announce', function(data) {
    updatePeer(data.id, data);
  });

  conference.on('peer:update', function(data) {
    updatePeer(data.id, data);
  });

  conference.on('call:started', function(id, pc, data) {
    updatePeer(id, extend({ connection: pc }, data), true);
  });

  conference.on('stream:added', streamAdd);
  conference.on('stream:removed', streamRemove);
  conference.on('call:ended', removePeer);

  participants.findById = findById;

  return participants;
};
