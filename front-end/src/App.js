import React, { useEffect, useState, useRef } from 'react';

function App() {
  const [localMedia, setLocalMedia] = useState();
  const localMediaRef = useRef();
  const [remoteMedia, setRemoteMedia] = useState();

  const peerConnection = new RTCPeerConnection();

  const constraints = {
    video: true,
    audio: false,
  };

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

  useEffect(() => {
    const getLocalMedia = async () => {
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        console.log('error getting local media devices: ', error);
      }
      console.log(mediaStream);
      setLocalMedia(mediaStream);
      localMediaRef.current = mediaStream;
      document.getElementById('localVideo').srcObject = mediaStream;
    };
    getLocalMedia();
  }, []);

  useEffect(() => {
    const getRemoteMedia = async () => {
      peerConnection.createOffer().then((offer) => {
        peerConnection.setLocalDescription(offer);
        ws.send(JSON.stringify({
          message: "localDescription",
          data: peerConnection.localDescription
        }))
      })
    }
    getRemoteMedia();
  }, [])

  return (
    <div>
      <p>test</p>
      <video
        muted
        autoplay="autoplay"
        id="localVideo"
        style={{ border: '1px solid black' }}
      ></video>
      <video
        muted
        autoplay="autoplay"
        id="remoteVideo"
        style={{ border: '1px solid black' }}
      ></video>
    </div>
  );
}

export default App;
