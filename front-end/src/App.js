import React, { useEffect, useRef } from 'react';

function App() {
  const peerConnection = useRef();
  const username = `mark${Math.floor(Math.random() * 10)}`;

  // open websocket to signaling server.
  const ws = new WebSocket(`wss://192.168.0.24:8080`);

  useEffect(() => {
    const createPeerConnection = async () => {
      peerConnection.current = new RTCPeerConnection({
        configuration: {
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        },
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      peerConnection.current.onicecandidate = (candidate) => {
        console.log('Ice candidate', candidate);
        ws.send(
          JSON.stringify({
            message: 'iceCandidate',
            data: candidate,
            sender: username,
          })
        );
      };

      peerConnection.current.onnegotiationneeded = async (event) => {
        console.log('Negotiation needed', event);
        await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription();
        console.log(
          `${username}'s localDescription`,
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
      };
      peerConnection.current.ontrack = (track) => {
        console.log('New Track', track);
      };
      peerConnection.current.onIcConnectionStateChange = (newState) => {
        console.log('ice connection state changed: ', newState);
      };
      peerConnection.current.onsignalingStateChange = (newState) => {
        console.log('Signaling state changed: ', newState);
      };
    };

    const getLocalMedia = async () => {
      let stream;
      const constraints = {
        video: true,
        audio: false,
      };
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        stream
          .getTracks()
          .forEach(
            async (track) =>
              await peerConnection.current.addTrack(track, stream)
          );
        document.getElementById('localVideo').srcObject = stream;
      } catch (error) {
        console.log('error getting local media devices: ', error);
      }
    };
    getLocalMedia();
    createPeerConnection();
  }, []);

  useEffect(() => {
    ws.addEventListener('open', () => {
      console.log('connection is open');

      ws.addEventListener('message', (message) => {
        const sender = JSON.parse(message.data).sender;
        const data = JSON.parse(message.data);
        console.log('received data from sender: ', sender, data);

        switch (JSON.parse(message.data).type) {
          case 'sdpOffer':
            console.log('my name', username);
            console.log('senders name', sender);
            if (sender !== username)
              createAnswer(JSON.parse(message.data).data);

            break;
          case 'iceCandidate':
            console.log('adding ice candidate from: ', sender);
            peerConnection.current.addIceCandidate(data);
            break;
          default:
            console.log('default case reached.');
        }
      });
      ws.addEventListener('error', (error) => {
        console.log('Error: ', error);
      });
    });

    const createAnswer = async (data) => {
      console.log('trigger createAnswer');
      // await peerConnection.current.createAnswer(data);
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
