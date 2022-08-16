import React, { useEffect, useRef, useState } from 'react';

function App() {
  const peerConnection = useRef();
  const localVideo = useRef();
  const remoteVideo = useRef();
  const [username, setUsername] = useState(
    `mark${Math.floor(Math.random() * 10)}`
  );

  // open websocket to signaling server.
  const ws = new WebSocket(`wss://192.168.0.29:8080`);

  useEffect(() => {
    const createPeerConnection = async () => {
      peerConnection.current = new RTCPeerConnection({
        configuration: {
          offerToReceiveAudio: false,
          offerToReceiveVideo: true,
        },
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      // peerConnection.current.createDataChannel("channel");
      peerConnection.current.onnegotiationneeded = async (event) => {
        console.log('Negotiation needed', event);
        let offer;
        try {
          offer = await peerConnection.current.createOffer({
            offerToReceiveAudio: false,
            offerToReceiveVideo: true,
          });
        } catch (error) {
          console.log('create offer error', error)
        }
        try {
          await peerConnection.current.setLocalDescription(offer);
        } catch (error) {
          console.log('set local description error: ', error)
        }
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
          console.log('send sdp offer error', error);
        }
      };

      peerConnection.current.onicecandidate = (event) => {
        console.log('Sending Ice candidate to server', event.candidate);
        ws.send(
          JSON.stringify({
            message: 'iceCandidate',
            data: event.candidate,
            sender: username,
          })
        );
      };

      peerConnection.current.ontrack = ({ track, streams }) => {
        console.log('New remote mediastream', track, streams);
        remoteVideo.current = document.getElementById('remoteVideo');
        try {
          remoteVideo.current.srcObject = streams[0];
          document.getElementById('remoteVideo').srcObject = streams[0];
        } catch(error) {
          console.log('addtrack error', error)
        }
        console.log(remoteVideo.current.srcObject);
      };

      peerConnection.current.onIceConnectionStateChange = (newState) => {
        console.log('ice connection state changed: ', newState);
      };

      peerConnection.current.onsignalingStateChange = (newState) => {
        console.log('Signaling state changed: ', newState);
      };

      // const offer = await peerConnection.current.createOffer({
      //   offerToReceiveAudio: false,
      //   offerToReceiveVideo: true,
      // });
      // await peerConnection.current.setLocalDescription(offer);

      // ws.send(
      //   JSON.stringify({
      //     message: 'sdpOffer',
      //     data: peerConnection.localDescription,
      //     sender: username,
      //   })
      // );
    };

    const getLocalMedia = async () => {
      let stream;
      const constraints = {
        video: true,
        audio: false,
      };
      localVideo.current = document.getElementById('localVideo');
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('local mediastream object', stream);
      localVideo.current.srcObject = stream;
      stream
        .getTracks()
        .forEach(
          async (track) => await peerConnection.current.addTrack(track, stream)
        )
      //   const offer = await peerConnection.current.createOffer({
      //   offerToReceiveAudio: false,
      //   offerToReceiveVideo: true,
      // });
      // await peerConnection.current.setLocalDescription(offer);

      ws.send(
        JSON.stringify({
          message: 'sdpOffer',
          data: peerConnection.localDescription,
          sender: username,
        })
      );
    };
    getLocalMedia();
    createPeerConnection();
  }, []);

  useEffect(() => {
    ws.addEventListener('open', () => {
      console.log('connection is open');

      ws.addEventListener('message', async (message) => {
        const sender = JSON.parse(message.data).sender;
        const data = JSON.parse(message.data);
        const answer = data.answer;
        console.log(sender,data,answer);
        switch (data.type) {
          case 'sdpOffer':
            console.log('my name', username);
            console.log('senders name', sender);
            console.log(data);
            if (!data.data) return;
            if(answer) {
              peerConnection.current.setLocalDescription(answer);
            }
            try {
              await peerConnection.current.setRemoteDescription({
                type: data.data.type,
                sdp: data.data.sdp,
              });
              await peerConnection.current.createAnswer().then(async(answer) => {
                await peerConnection.current.setLocalDescription(answer)
                console.log(peerConnection.current.localDescription)
              });
            } catch (error) {
              console.log('error setting remote description: ', error)
            } // do we need to send answer instead......
            ws.send(
              JSON.stringify({
                message: 'sdpOffer',
                data: peerConnection.current.localDescription,
                sender: username,
                answer: true
              })
            );
            break;

          case 'iceCandidate':
            console.log('adding ice candidate from: ', sender, data.data);
            if (data.data)
              await peerConnection.current.addIceCandidate(data.data);
            break;

          default:
            console.log('default case reached.');
        }
      });
      ws.addEventListener('error', (error) => {
        console.log('Error: ', error);
      });
    });
  }, []);

  return (
    <div>
      <p>test</p>
      <video
        muted
        autoplay="autoplay"
        id="localVideo"
        style={{ border: '1px solid black' }}
        ref={localVideo}
      ></video>
      <video
        muted
        autoplay="autoplay"
        id="remoteVideo"
        style={{ border: '1px solid black' }}
        ref={remoteVideo}
      ></video>
    </div>
  );
}

export default App;
