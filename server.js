const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let players = [];
let multiplier = 1.00;
let isRoundRunning = false;
let crashPoint = 0;

function startNewRound() {
  players = [];
  multiplier = 1.00;
  isRoundRunning = true;
  crashPoint = (Math.random() * 8 + 1.2).toFixed(2);
  io.emit('new_round_started');
  io.emit('players_update', players);
  
  let interval = setInterval(() => {
    multiplier += 0.05;
    io.emit('multiplier_update', multiplier.toFixed(2));
    if (multiplier >= parseFloat(crashPoint)) {
      isRoundRunning = false;
      io.emit('crashed', crashPoint);
      clearInterval(interval);
      setTimeout(startNewRound, 3000);
    }
  }, 100);
}

io.on('connection', (socket) => {
  socket.on('place_bet', (data) => {
    let p = { id: socket.id, name: data.name || 'Player', bet: data.bet, cashedOut: false };
    players.push(p);
    io.emit('players_update', players);
  });
  socket.on('cashout', (data) => {
    let p = players.find(pl => pl.id === socket.id);
    if (p && !p.cashedOut) {
      p.cashedOut = true;
      p.win = (p.bet * multiplier).toFixed(2);
      io.emit('players_update', players);
    }
  });
});

app.get('/api/status', (req, res) => {
  res.json({ status: 'Aviator Server Running' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startNewRound();
});
