# Chapter 3
Just some essentials I'd like to remember.

## TCP
Network protocols are divided into layers, essentially layers of abstraction on top of the metal. TCP is a lyer on top of IP that utilizes byte-streams instead of packets as a way of providing orderly delivery. (A byte stream is simply an ordered sequence of bytes). A protocol, rather than the application, is used to make sense of these bytes. Protocols are like file formats, except that the total length is unknown and the data is read in one pass.

## TCP vs UDP
The key difference: boundaries.

UDP: Each read from a socket corresponds to a single write from the peer.
TCP: No such correspondence! Data is a continuous flow of bytes.

TCP simply has no mechanism for preserving boundaries.

1. TCP send buffer: This is where data is stored before transmission. Multiple writes are indistinguishable from a single write.
2. Data is encapsulated as one or more IP packets, IP boundaries have no relationship to the original write boundaries.
3. TCP receive buffer: Data is available to applications as it arrives.

### In summary
UDP is like sending a stack of letters one at a time, TCP is just like a firehose of data.

## More on TCP
TCP startes with a handshape between client/server, server waits for client at a specific address (IP +port), this step is called *bind and listen*, the client can then connect with a 3 step handshake (SYN, SYN-ACK, ACK) <- semaphores.

### TCP is bidirectional & Full-Duplex
Meaning client / server can both send and receive messages to each other. Also both channels can be terminated independently. 

## Sockets
The socket API ontop of Node.js is just an abstraction layer over OS primitives, in linux a socket handle is just a file descriptor (fd). (Need to learn how the OS actually handles things). OS handles must be terminated by the application to free the resources/handle. The APIs for Node.js will hold your hand about it. 

### Listening vs. Connection sockets
A TCP server listens on an IP + port (again, how does that work in the underlying OS) accepting client connections from that address. The listening address is also represented by a socket handle. 

A *listening socket* is what's listening on that address and passes off accepted connections to a *connection socket* this is like a doorman redirecting a customer to an available customer service window/kiosk.

### FIN
Closing a socket terminates connection by sending TCP FIN, shutdown on the other hand only closes one side. 

### Primitives 
Listening socket:
- bind & listen
- accept
- close
Connection socket:
- read
- write
- close

## The Event Loop 
```js
// pseudo code!
while (running) {
    let events = wait_for_events(); // blocking
    for (let e of events) {
        do_something(e);    // may invoke callbacks
    }
}
```
The runtime polls for IO events from the OS, such as a new connection arriving, a socket becoming ready to read, or a timer expiring. Then the runtime reacts to the events and invokes the callbacks that the programmer registered earlier. This process repeats after all events have been handled, thus it’s called the event loop.

### Threads
The event loop is single-threaded and shares a thread with your JS code, which is completely insane to me but I'm not a google engineer. 

When a callback returns or *awaits*, control returns from your code to the runtime so that it can emit events and shcedule other tasks. This means **JS code is meant to finish fast** because the event loop halts at the same time.

### Node.Js - Event Based Concurrency
A server can have multiple connections simultaneously, and each connection can emit events. While an event is being handled, the runtime (single-threaded) cannot do a thing for the other connections until it returns. The longer an event is processed, the longer everything else is delayed.

### Async/Sync - Blocking / Non-Blocking IO
It's vital to avoid blocking the event loop for too long. Or things get gummed up. Solved by yielding to the run time, and moving CPU intensive code into a parallel scope.

But understand the OS provides **blocking mode** and **non-blocking mode** for network IO

- In **blocking mode**, the calling OS thread blocks until the result is ready
- In **non-blocking mode**, the OS immediately returns if the result is not ready (or is), and can notify of readiness.

Node.JS uses non-blocking to create concurrency (kitchen timer versus worker bee).

### IO in Node.js is Asynchronous
Most Node.js library functions related to IO are either callback-based or promise-based. Promises can be viewed as another way to manage callbacks. These are also described as asynchronous, meaning that the result is delivered via a callback. These APIs do not block the event loop because the JS code doesn’t wait for the result; instead, the JS code returns to the runtime, and when the result is ready, the runtime invokes the callback to continue your program.

### Event-Based Programming Beyond Networking
IO is more than disk files and networking. In GUI systems, user input from the mouse and keyboard is also IO. And event loops are not unique to the Node.js runtime; Web browsers and all other GUI applications also use event loops under the hood. You can transfer your experience in GUI programming to network programming and vice versa.

### Promise-Based IO
Promise-based APIs are like an async wrapper around a call-back, allowing you to await on a callback. It doesn't seem quite this simple, but a callback appears to be sync, and chaotic, while promises allow an async model to be used and prevent blocking the event loop.

# Chapter 4 - Promise
Didn't want to do multiple files / folders for notes so they're all in here.

## Promiseses
```js
function do_something_promise() {
    return new Promise<T>((resolve, reject) => {
        do_something_cb((err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}
```
let's us do 
```js
async function my_app() {
    try {
        const result: T = await do_something_promise();
    } catch (err) {
        // fail.
    }
}
```
instead of
```js
function my_app() {
    do_something_cb((err, result) => {
        if (err) {
            // fail.
        } else {
            // success, use the result.
        }
    });
}
```
The advantage lies in the neatly enapsulated logic, avoiding callback hell.
When looking at the top level promise you see a promise which returns type T takes in 2 arguements (really a lambda which takes two arguments), 'resolve' which returns a value on await (promise fulfilled) or 'reject' on promise rejectet/failed, throwing an exception.

## 'async' and 'await'
There are 2 types of JS functions, normal and async. 

### async functions yield to the runtime by await.
Promise (type) is initially  a way to manage callbacks (chaining). Async functions can return to the runtime in the middle of execution ('await'ing a promise). The execution of the async function resumes with the result of the promise. Allowing sequential IO code in the same function. 

#### Tasks
Calling async functions start new tasks. Similar to starting a thread.

## Events -> Promises
The net module doesn't provide a promise based API so we're gonna make one.
```js
function soRead(conn: TCPConn): Promise<Buffer>;
function soWrite(conn: TCPConn, data: Buffer): Promise<void>;
```



