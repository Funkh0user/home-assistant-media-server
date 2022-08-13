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
let allParticipants = [];
let peerCount = 0;

wss.on('connection', (ws) => {
  ws.on('message', (peerMessage) => {

    const { message, sender, data } = JSON.parse(peerMessage);
    peerCount += 1;
    const participant = new Participant(peerCount, ws, sender);

    console.log('received message from peer: ', sender);
    participant.username = sender;
    allParticipants.push(participant);
    switch (message) {
      case 'sdpOffer':
        console.log('localDescriptionReceived', sender);
        allParticipants.forEach((parti) => {
          console.log('trig', parti.username, participant.username);
          if (parti.username !== participant.username) {
            console.log('trigger', participant.username);
            participant.ws.send(
              JSON.stringify({
                type: 'sdpOffer',
                data: data,
                sender: parti.username,
                ////add recipient property?
              })
            );
          }
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
