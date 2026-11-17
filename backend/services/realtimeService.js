let io;
let broadcastTimeout;

function setRealtimeServer(server) {
  io = server;
}

function broadcastDataChanged() {
  if (!io) return;

  clearTimeout(broadcastTimeout);
  broadcastTimeout = setTimeout(() => {
    io.emit("data:changed");
  }, 200);
}

module.exports = { setRealtimeServer, broadcastDataChanged };
