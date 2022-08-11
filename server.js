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
    console.log('socket server running on 8080')
});

const wss = new WebSocketServer({ server: socketServer });

wss.on('connection', (ws) => {
  console.log('connected');
  ws.send('connected to server.');

  ws.on('message', (data) => {
    const { message } = JSON.parse(data);
    console.log('received message from client.', message);
    switch (message) {
      case 'open':
        console.log('testing switch statement.');
        break;
      case 'localDescription':
        console.log('localDescriptionReceived');
      default:
        console.log('default condition reached.');s
    }
  });
});

app.get('/', (req, res) => {
  res.sendFile('index.html');
});
