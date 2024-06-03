"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var net = require("net");
var server = net.createServer();
function connect(socket) {
    console.log("Connected: ", socket.remoteAddress, socket.remotePort);
    socket.on('end', function () {
        // FIN received. The connection will be closed automatically.
        console.log('EOF.');
    });
    socket.on('data', function (data) {
        console.log('data:', data);
        socket.write(data); // echo back the data.
        // actively closed the connection if the data contains 'q'
        if (data.includes('q')) {
            console.log('closing.');
            socket.end(); // this will send FIN and close the connection.
        }
    });
}
server.on('connection', connect);
server.on('error', function (err) { throw err; });
server.listen({ host: '127.0.0.1', port: 1234 });
console.log(server);
