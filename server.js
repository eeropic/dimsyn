var args = process.argv.slice(2);
const port = 0 | args[0] || 3000;

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
})

app.use(express.static(__dirname + '/docs'))

server.listen(port);

console.log(`HTTPS server running at ${hostName}:${port}`)

const midiInput = new midi.Input();
for (var i = 0; i < midiInput.getPortCount(); ++i) {
    console.log('Port ' + i + ' name: ' + midiInput.getPortName(i));
}
midiInput.on('message', (deltaTime, message) => {
    console.log(message)
    if(socket!=null){
      socket.send(JSON.stringify(['midi',...message]))
    }
});

midiInput.openPort(midiInput.getPortCount()-1);