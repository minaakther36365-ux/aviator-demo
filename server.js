const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.get('/', (req, res) => { res.send('Aviator Server Running'); });
let players = []; let multiplier = 1.00; let isRoundRunning = false;
function startNewRound() {
  players = []; multiplier = 1.00; isRoundRunning = true;
  let crashPoint = (Math.random() * 8 + 1.2).toFixed(2);
  io.emit('new_round_started'); io.emit('players_update', players);
  let interval = setInterval(() => {
    multiplier += 0.05; io.emit('multiplier_update', multiplier.toFixed(2));
    if (multiplier >= parseFloat(crashPoint)) {
      isRoundRunning = false; io.emit('crashed', crashPoint);
      clearInterval(interval); setTimeout(startNewRound, 5000);
    }
  }, 100);
}
io.on('connection', (socket) => {
  socket.on('place_bet', (data) => {
    let p = { id: socket.id, name: data.name||'Player', bet: data.bet, cashedOut: false, win: 0 };
    players.push(p); io.emit('players_update', players);
  });
  socket.on('cashout', (data) => {
    let p = players.find(pl => pl.id === socket.id);
    if (p && isRoundRunning) { p.cashedOut = true; p.win = data.winAmount; io.emit('players_update', players); }
  });
});
startNewRound();
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => { console.log('Running'); });
