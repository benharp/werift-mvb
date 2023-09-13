# Installation

- Download, and run `npm install`

# Running

- Open frontend.html as a file in your browser (I test with Chrome/Chromium WebRTC)

- `node app.js` in your terminal

- You'll see connected! in both consoles when websocket connection is established

# Reproducing the bug

- **Press "Add Remote Track" twice.**
- **Press "Remove Remote Track" twice.** The connection now has two inactive transceivers, with mids "0av" and "1av". (Chromium browsers won't show them in the list, but the werift console will)
- **Press "Add local track".** In your browser console, you will see `DOMException: Failed to execute 'setRemoteDescription' on 'RTCPeerConnection': Failed to set remote answer sdp: A BUNDLE group in answer contains a MID='1av' that was not in the offered group.`

- The transceiver "0av" will be re-used for the track added by the web browser. "1av" is still inactive. Chromium WebRTC offers a bundle "0" (just the newly created browser track) while werift constructs bundle "0, 1av". Chromium throws an error because the bundle description offered and received should match.
- Chromium builds the bundle based on only active transceiver, but werift builds its bundle answer to include all transceivers.
- Also note that werift's build offer logic only supplies active transceivers, and therefore you can add and remove as many remote tracks (which utilize werift to make the offer) without error.