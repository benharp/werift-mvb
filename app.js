import werift from "werift";
import { WebSocketServer } from "ws";


const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws) {
    console.log("Connected!")

    const send = (type, payload) => {
        ws.send(JSON.stringify({ type, payload }));
    };

    ws.on('error', console.error);

    ws.on('message', async function message(info) {
        const {type, payload} = JSON.parse(info);
        switch (type) {
            case "offer":
                await peer.setRemoteDescription(payload);
                await peer.setLocalDescription(await peer.createAnswer());
                console.log("Received offer bundle:", payload.sdp.match(/(BUNDLE.*)/g))
                console.log("Sending answer bundle:", peer.localDescription.sdp.match(/(BUNDLE.*)/g))
                send("answer", { sdp: peer.localDescription });
                logTransceiverList();
                break;
            case "answer":
                console.log("Received answer bundle:", payload.sdp.match(/(BUNDLE.*)/g))
                console.log("Previously sent offer bundle:", peer.localDescription.sdp.match(/(BUNDLE.*)/g))
                await peer.setRemoteDescription(payload);
                logTransceiverList();
                break;
            case "add track":
                console.log("Adding new transceiver")
                peer.addTransceiver("audio", { direction: "sendonly" });
                await renegotiate();
                break;
            case "remove track":
                console.log("Removing first sendonly transceiver")
                const activeSenderList = peer.getTransceivers().filter((tran) => { return tran.direction === "sendonly"})
                console.log("Removing:", activeSenderList[0].mid)
                peer.removeTrack(activeSenderList[0].sender);
                await renegotiate();
                break;
            }
            
        ws.on("open", () => {
            console.log("Open!");
        })
    });


    async function renegotiate() {
        await peer.setLocalDescription(await peer.createOffer());
        // peer.getTransceivers().forEach((val) => console.log(val.mid, val.direction))
        send(peer.localDescription.type, { sdp: peer.localDescription });
    }

    function logTransceiverList() {
        let list = "Transceivers:";
        peer.getTransceivers().forEach((tran) => {
            list = list.concat(` ${tran.mid}: ${tran.currentDirection},`)
        })
        list = list.concat(" Bundle: ", peer.localDescription.sdp.match(/(BUNDLE.*)/g))
        console.log(list);
    }

    const peer = new werift.RTCPeerConnection({});
});