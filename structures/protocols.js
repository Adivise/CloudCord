const trace = require('debug')('soundcloud-rp:trace');

module.exports = function(config, io, rpc) {

  const activity = require('./activity.js')(config, rpc);

  io.on('connection', function(socket){
    trace('client.connection', socket.id);

    socket.on('activity', function(data){
      trace('client.event', socket.id, 'activity', data);

      activity(data).then(() => {
        socket.emit('activity', true, {});
      }).catch((err) => {
        socket.emit('activity', false, {
          error: err.name,
          message: err.message
        });
      })
    });

    socket.on('disconnect', function(){
      trace('client.disconnect', socket.id);
    });
  });
};