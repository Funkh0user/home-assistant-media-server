const express = require('express');
const fs = require('fs');
const app = express();
app.use(express.static('./front-end/build'));
const http = require('http');
const https = require('https');
const { WebSocketServer } = require('ws');

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

let peerCount = 0;
wss.on('connection', (ws) => {
  console.log(`peer ${peerCount} connected`);
  const participant = new Participant(peerCount);
  peerCount += 1;
  ws.on('message', (peerMessage) => {
    const { message, sender, data } = JSON.parse(peerMessage);
    console.log('received message from peer.');
    participant.username = sender;
    switch (message) {
      case 'sdpOffer':
        console.log('localDescriptionReceived', sender, data);
        ws.send(
          JSON.stringify({
            type: 'sdpOffer',
            data: data,
            sender: participant.username,
          })
        );
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
  constructor(data) {
    this.id = data.id;
  }
  username = '';
}
