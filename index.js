var Observ = require('observ');
var ObservArray = require('observ-array');
var ObservStruct = require('observ-struct');

module.exports = function(signaller) {
  var participants = ObservArray([]);

  function handleUpdate(data) {
    var p = {};

    participants.transaction(function(raw) {
      var idx = 0;
      while (idx < raw.length && raw[idx].id() !== data.id) {
        idx++;
      }

      if (idx < raw.length) {
        Object.keys(data).forEach(function(key) {
          if (raw[idx][key]() !== data[key]) {
            raw[idx][key].set(data[key]);
          }
        });
      }
      else {
        Object.keys(data).forEach(function(key) {
          p[key] = Observ(data[key]);
        });

        raw.push(ObservStruct(p));
      }
    });
  }

  ['local:announce', 'peer:announce', 'peer:update'].forEach(function(evtName) {
    signaller.on(evtName, handleUpdate);
  });

  participants.findById = function(id) {
    var idx = 0;
    var len = participants.getLength();
    while (idx < len && participants.get(idx).id() !== id) {
      idx++;
    }

    if (idx < len) {
      return participants.get(idx);
    }
  };

  return participants;
};
