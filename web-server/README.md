# Chapter Notes
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

So you're basically meant to work with the event loop / runtime in a sort of symbiotic bi-directional relationship. Seems kind of toxic/codependent but idk.

### Node.Js - Event Based Concurrency
