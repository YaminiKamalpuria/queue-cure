const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const {
  addPatient,
  callNext,
  setAvgTime,
  lookupToken,
  getPublicState,
  resetQueue
} = require('./queue');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['polling', 'websocket']
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'Queue Cure server running' });
});

function broadcast() {
  io.emit('queue:state', getPublicState());
}

io.on('connection', (socket) => {
  console.log(`Connected: ${socket.id}`);
  socket.emit('queue:state', getPublicState());

  socket.on('patient:add', ({ name }, cb) => {
    if (!name || typeof name !== 'string' || !name.trim())
      return cb?.({ success: false, error: 'Name is required' });
    if (name.trim().length > 60)
      return cb?.({ success: false, error: 'Name too long' });
    const token = addPatient(name.trim());
    broadcast();
    cb?.({ success: true, token });
  });

  socket.on('queue:next', (_, cb) => {
    const token = callNext();
    broadcast();
    cb?.({ success: true, token });
  });

  socket.on('avgTime:set', ({ minutes }, cb) => {
    const ok = setAvgTime(minutes);
    if (ok) { broadcast(); cb?.({ success: true }); }
    else cb?.({ success: false, error: 'Enter a valid time between 1 and 120 minutes' });
  });

  socket.on('token:lookup', ({ token }, cb) => {
    if (!token || typeof token !== 'string')
      return cb?.({ found: false, error: 'Token is required' });
    cb?.(lookupToken(token.trim()));
  });

  socket.on('queue:reset', (_, cb) => {
    resetQueue();
    broadcast();
    cb?.({ success: true });
  });

  socket.on('disconnect', () => {
    console.log(`Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Queue Cure server running on port ${PORT}`);
});