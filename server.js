const express = require('express');
const fs = require('fs');
const app = express();
app.use(express.static('./front-end/build'));
const http = require('http');
const https = require('https');
const { WebSocketServer, WebSocket } = require('ws');

const credentials = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt'),
};
const httpsServer = https.createServer(credentials, app).listen(3001, () => {
  console.log('react dev server on 3000');
});
const socketServer = https.createServer(credentials).listen(8080, () => {
  console.log('socket server running on 8080');
});

const wss = new WebSocketServer({ server: socketServer });
let allParticipants = [];
let peerCount = 0;

wss.on('connection', (ws) => {
  ws.on('message', (peerMessage) => {
    console.log(JSON.parse(peerMessage));
    const { message, sender, data, answer } = JSON.parse(peerMessage);
    peerCount += 1;
    const participant = new Participant(peerCount, ws, sender);
    allParticipants.push(participant);

    switch (message) {
      case 'sdpOffer':
        console.log('localDescription / sdp offer from: ', sender);
        wss.clients.forEach((client) => {
          if (client !== ws)
            client.send(
              JSON.stringify({ type: 'sdpOffer', data: data, sender: sender, answer: answer })
            );
        });
        break;
      case 'iceCandidate':
        console.log('Ice candidate from: ', sender, data);
        wss.clients.forEach((client) => {
          if (client !== ws)
            client.send(
              JSON.stringify({
                type: 'iceCandidate',
                data: data,
                sender: sender,
              })
            );
        });
        break;
      default:
        console.log('default condition reached.');
    }
  });
});

app.get('/', (req, res) => {
  res.sendFile('index.html');
});

// functions what handles signaling workflowz.
class Participant {
  constructor(id, ws, username) {
    this.id = id;
    this.ws = ws;
    this.username = username;
  }
}
