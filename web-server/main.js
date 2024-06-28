"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var net = require("net");
// socket wrapper
function Init(socket) {
    var connection = {
        socket: socket, error: null, ended: false, call: null,
    };
    socket.on('data', function (data) {
        console.assert(connection.call);
        // pause until next read
        connection.socket.pause();
        // fulfill promise of current read
        connection.call.get(data);
        connection.call = null;
    });
    socket.on('end', function () {
        // fulfill current read
        connection.ended = true;
        // fulfill, send EOF
        if (connection.call) {
            connection.call.get(Buffer.from(''));
            connection.call = null;
        }
    });
    socket.on('error', function (error) {
        // deliver errors to current read
        connection.error = error;
        // deliver, propagate error up
        if (connection.call) {
            connection.call.fail(error);
            connection.call = null;
        }
    });
    return connection;
}
function Read(connection) {
    // no concurrent calls 
    console.assert(!connection.call);
    // fulfill promise contract (defined in type and init above)
    return new Promise(function (get, fail) {
        // if there's an error
        if (connection.error) {
            fail(connection.error);
            return;
        }
        // if EOF
        if (connection.ended) {
            get(Buffer.from(''));
            return;
        }
        // save callbacks
        connection.call = { get: get, fail: fail };
        // resume 'data' event to fulfill promise
        connection.socket.resume();
    });
}
function Write(connection, data) {
    // checking EOF
    console.assert(data.length > 0);
    return new Promise(function (get, fail) {
        // if there's an error, fail
        if (connection.error) {
            fail(connection.error);
            return;
        }
        /*

        COME BACK TO THIS LATER AND MAKE SURE YOU ACTUALLY UNDERSTAND THE CODE

        */
        connection.socket.write(data, function (error) {
            if (error) {
                fail(error);
            }
            else {
                get();
            }
        });
    });
}
var server = net.createServer({
    pauseOnConnect: true, // required by 'Connection' type
});
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
