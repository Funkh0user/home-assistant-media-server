import React, { useState } from 'react';

function App() {
  const [localmedia, setLocalmedia] = useState();
  const pc = new RTCPeerConnection();

  // open websocket to signaling server.
  const ws = new WebSocket(`wss://192.168.0.24:8080`);

  ws.addEventListener('open', () => {
    console.log('connection is open');
    ws.send(JSON.stringify({ message: 'open' }));

    ws.addEventListener('message', (args) => {
      console.log('received test event.', args);
    });
  });

  // functions for gathering local and remote media.

  const getLocalMedia = () => {};

  return (
    <div>
      <p>test</p>
      <video>
        {/* <source src={}>
        </source>
        <source src={}>
        </source> */}
      </video>
    </div>
  );
}

export default App;
