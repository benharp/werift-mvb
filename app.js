// Try to add two sends, then remove two sends, then add one receive

// Or could potetnially go with pubsub example
// Do pub sub sub unsub unsub pub should acomplish same thing
// But would have to fix the bug there: DOMException: replaceTrack cannot be called on a stopped sender
// Or existing bug might be the same thing? 


import werift from "werift";
import { Server } from "socket.io";

const io = new Server({
    cors: {
        origin: `${"http://127.0.0.1"}:${5500}`, // VS code "live server" extension. Port is random
    },
});
const THIS_SERVER_PORT = 4000;

io.on("connection", async (socket) => {
    const peer = new werift.RTCPeerConnection({
        codecs: {
            audio: [
                new werift.RTCRtpCodecParameters({
                    mimeType: "audio/PCMU",
                    clockRate: 8000,
                    payloadType: 0,
                    channels: 1,
                }),
            ],
            video: [
                new werift.RTCRtpCodecParameters({
                    mimeType: "video/VP8",
                    clockRate: 90000,
                    payloadType: 96,
                }),
            ],
        },
        bundlePolicy: "balanced",
    });

    console.log("Connected!");

    socket.on("add track", async () => {
        console.log("Add track")
        peer.addTransceiver("audio", { direction: "sendonly" });
        await renegotiate();
        // peer.getTransceivers().forEach((x) => {console.log(x.mid, x.direction)})
    })

    // On command, remove the first active sender (but this could be any sender)
    socket.on("remove track", async () => {
        console.log("Remove last active sendonly transceiver")
        const activeSenderList = peer.getTransceivers().filter((tran) => { return tran.direction === "sendonly"})
        console.log("Removing:", activeSenderList[0].mid)
        peer.removeTrack(activeSenderList[0].sender);
        await renegotiate();
        // peer.getTransceivers().forEach((x) => {console.log(x.mid, x.direction)})
    })

    async function renegotiate() {
        await peer.setLocalDescription(await peer.createOffer());
        // peer.getTransceivers().forEach((val) => console.log(val.mid, val.direction))
        socket.emit("signal", peer.localDescription);
    }

    function logTransceiverList() {
        let list = "Transceivers:";
        peer.getTransceivers().forEach((tran) => {
            list = list.concat(` ${tran.mid}: ${tran.currentDirection},`)
        })
        list = list.concat(" Bundle: ", peer.localDescription.sdp.match(/(BUNDLE.*)/g))
        console.log(list);
    }

    socket.on("signal", async (data) => {
        if (data.type === "offer") {
            await peer.setRemoteDescription(data);
            await peer.setLocalDescription(await peer.createAnswer());
            console.log("Received offer bundle:", data.sdp.match(/(BUNDLE.*)/g))
            console.log("Sending answer bundle:", peer.localDescription.sdp.match(/(BUNDLE.*)/g))
            socket.emit("signal", peer.localDescription);
            logTransceiverList();
        } else if (data.type === "answer") {
            console.log("Received answer bundle:", data.sdp.match(/(BUNDLE.*)/g))
            console.log("Previously sent offer bundle:", peer.localDescription.sdp.match(/(BUNDLE.*)/g))
            await peer.setRemoteDescription(data);
            logTransceiverList();
        } else {
            console.log(data)
        }
    });
});

io.listen(THIS_SERVER_PORT, () => {
    console.log(`listening on localhost:${THIS_SERVER_PORT}`);
});
