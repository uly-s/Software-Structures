import * as net from "net";

// promise wrapper for socket read/write.
type Connection = {

    // JS socket object.
    socket: net.Socket;

    // from the 'error' event
    error: null | Error;

    // EOF from 'end'
    ended: boolean;

    // callbacks of the promises read
    reader: null | {
        resolve: (data: Buffer) => void,
        reject: (reason: Error) => void,
    };
}

// socket wrapper
function Init(socket: net.Socket): Connection {
    const connection: Connection = {
        socket: socket, error: null, ended: false, reader: null, 
    };

    socket.on('data', (data: Buffer) => {
        console.assert(connection.reader);

        // pause until next read
        connection.socket.pause();

        // fulfill promise of current read
        connection.reader!.resolve(data);
        connection.reader = null;
    })

    socket.on('end', () => {
        
        // fulfill current read
        connection.ended = true;

        // fulfill, send EOF
        if(connection.reader) {
            connection.reader.resolve(Buffer.from('')); 
            connection.reader = null;
        }
    });

    socket.on('error', (error: Error) => {

        // deliver errors to current read
        connection.error = error;

        // deliver, propagate error up
        if (connection.reader) {
            connection.reader.reject(error);
            connection.reader = null;
        }
    })

    return connection;
}

function Read(connection: Connection): Promise<Buffer> {
    
    // no concurrent calls 
    console.assert(!connection.reader);

    // fulfill promise contract (defined in type and init above)
    return new Promise((resolve, reject) => {
        
        // if there's an error
        if (connection.error) {
            reject(connection.error);
            return;
        }
        
        // if EOF
        if (connection.ended) {
            resolve(Buffer.from(''))
            return;
        }

        // save callbacks
        connection.reader = {resolve: resolve, reject: reject};

        // resume 'data' event to fulfill promise
        connection.socket.resume();
    })
}


function Write(connection: Connection, data: Buffer): Promise<void> {

    // checking EOF
    console.assert(data.length > 0);

    return new Promise((resolve, reject) => {

        // if there's an error, fail
        if (connection.error) {
            reject(connection.error);
            return;
        }

        /*

        COME BACK TO THIS LATER AND MAKE SURE YOU ACTUALLY UNDERSTAND THE CODE

        */
        connection.socket.write(data, (error?: Error) => {
            if (error) {
                reject(error);
            }
            else {
                resolve();
            }
        })
    })
}

let server = net.createServer({
    pauseOnConnect: true, // required by 'Connection' type
});

function connect(socket: net.Socket): void {

    console.log("Connected: ", socket.remoteAddress, socket.remotePort);
    socket.resume(); // required by 'Connection' type

    socket.on('end', () => {
        // FIN received. The connection will be closed automatically.
        console.log('EOF.');
    });

    socket.on('data', (data: Buffer) => {
        console.log('data:', data);
        socket.write(data); // echo back the data.

        // actively closed the connection if the data contains 'q'
        if (data.includes('q')) {
            console.log('closing.');
            socket.end();   // this will send FIN and close the connection.
        }

    });
}

async function newConnection(socket: net.Socket): Promise<void> {
    console.log('New Connection: ', socket.remoteAddress, socket.remotePort);

    try {
        await serve(socket);
    }
    catch (exception) {
        console.error('Error: ', exception);
    }
    finally {
        socket.destroy();
    }
}

async function serve(socket: net.Socket): Promise<void> {
    const connection = Init(socket);

    while (true) {
        const data = await Read(connection);
        if (data.length === 0) {
            break;
        }

        console.log('data:', data.toString());
        await Write(connection, data);
    }
}

server.on('connection', newConnection);
server.on('error', (err: Error) => { throw err; });

server.listen({host: '127.0.0.1', port: 1234});

console.log(server);