const args = require("minimist")(process.argv);
const port = 0 | args.p || 3000;

const os = require('os');
const osc = require('osc');
const fs = require('fs');
const https = require('https');
const WebSocket = require("ws");
const express = require('express')
const midi = require('midi');

const hostName = os.hostname()
const app = express()

const server = https.createServer({
    key: fs.readFileSync(`${__dirname}/eeroair.local+4-key.pem`, 'utf8'),
    cert: fs.readFileSync(`${__dirname}/eeroair.local+4.pem`, 'utf8')
}, app);

const wss = new WebSocket.Server({server, perMessageDeflate: false})

let socket = null

wss.on('connection', ws => {
  socket = ws
  ws.on('message', message => {
    console.log(`Received message => ${message}`)
  })
  //ws.send('Hello! Message From Server!!')
})

app.use(express.static(__dirname + '/public'))

server.listen(port);

console.log(`HTTPS server running at ${hostName}:${port}`)

// Set up a new input.
const midiInput = new midi.Input();

for (var i = 0; i < midiInput.getPortCount(); ++i) {
    console.log('Port ' + i + ' name: ' + midiInput.getPortName(i));
}

// Configure a callback.
midiInput.on('message', (deltaTime, message) => {
    console.log(message)
    if(socket!=null){
      socket.send(JSON.stringify(['midi',...message]))
    }
});

// Open the first available input port.
midiInput.openPort(midiInput.getPortCount()-1);

var udpPort = new osc.UDPPort({
  localAddress: "0.0.0.0",
  localPort: 9109,
  metadata: true
});

// Listen for incoming OSC messages.
udpPort.on("message", function (oscMsg, timeTag, info) {
  //console.log("An OSC message just arrived!", oscMsg);
  //console.log("Remote info is: ", info);
  if(oscMsg.address == "/finger"){
    [sequenceId, posX, posY, velX, velY, angle, majorAxis, minorAxis, frame, state, size, pressure] = oscMsg.args
    //console.log(posX,posY)
    if(socket != null){
      socket.send(JSON.stringify(oscMsg.args.map(arg => arg.value)))
    }
  }
});

// Open the socket.
udpPort.open();

/*
i sequenceId
f normalized position X
f normalized position Y
f normalized velocity X
f normalized velocity Y
f angle
f majorAxis
f minorAxis
i frame
i state
f size
*/

/*
states
MTTouchStateNotTracking = 0,
MTTouchStateStartInRange = 1,
MTTouchStateHoverInRange = 2,
MTTouchStateMakeTouch = 3,
MTTouchStateTouching = 4,
MTTouchStateBreakTouch = 5,
MTTouchStateLingerInRange = 6,
MTTouchStateOutOfRange = 7
*/