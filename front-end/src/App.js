import React, { useEffect, useState, useRef } from 'react';

function App() {
  const localMediaRef = useRef();
  const peerConnection = useRef();
  const username = `mark${Math.random() * 10}`;

  // open websocket to signaling server.
  const ws = new WebSocket(`wss://192.168.0.24:8080`);

  // const createPeerConnection = () => {
  peerConnection.current = new RTCPeerConnection();

  peerConnection.current.onicecandidate = (candidate) => {
    console.log('candidate', candidate);
  };

  peerConnection.current.onnegotiationneeded = (args) => {
    console.log('negotiation needed', args);
  };
  peerConnection.ontrack = (track) => {
    console.log(track);
  };
  // };

  useEffect(() => {
    const getLocalMedia = async () => {
      let mediaStream;
      const constraints = {
        video: true,
        audio: false,
      };
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        console.log('error getting local media devices: ', error);
      }
      document.getElementById('localVideo').srcObject = mediaStream;
      mediaStream
        .getTracks()
        .forEach(async (track) =>
          peerConnection.current.addTrack(track, mediaStream)
        );
    };
    getLocalMedia();
  }, []);

  useEffect(() => {
    ws.addEventListener('open', () => {
      console.log('connection is open');

      createSdpOffer();

      ws.addEventListener('message', (message) => {
        console.log('received message.', message);
        console.log(
          'received message from server.',
          message,
          JSON.parse(message.data)
        );
        switch (JSON.parse(message.data).type) {
          case 'sdpOffer':
            console.log(JSON.parse(message.data).sender);
            console.log(username, JSON.parse(message.data).sender);
            if (JSON.parse(message.data).sender !== username)
              createSdpAnswer(JSON.parse(message.data).data);
            break;
          default:
            console.log('default case reached.');
        }
      });
      ws.addEventListener('error', (args) => {
        console.log('Error: ', args);
      });
    });

    const createSdpOffer = async () => {
      peerConnection.current.createOffer().then(async (offer) => {
        console.log('peerOffer', offer);
        await peerConnection.current.setLocalDescription();

        console.log(
          'Peer localDescription',
          peerConnection.current.localDescription
        );
        try {
          ws.send(
            JSON.stringify({
              message: 'sdpOffer',
              sender: username,
              data: peerConnection.current.localDescription,
            })
          );
        } catch (error) {
          console.log('trycatch error', error);
        }
      });
    };

    const createSdpAnswer = (data) => {
      console.log('createSdpAnswer', data);
    };
  }, []);

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
