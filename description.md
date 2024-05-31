<!--example-->

# simple_udp

Javacript example that sends udp data through corelink

# labels
- javascript
- ws


sender tcp receiver tcp: Horrible performance

sender tcp receiver ws: 1 frame received out of 244

sender tcp receiver udp: Horrible performance

sender udp receiver tcp: Horrible performance

sender udp receiver udp: More chunks of frames received, but not full frames

sender udp receiver ws: More chunks of frames received, but not full frames

sender ws receiver udp: 5 full frames received out of 244

sender ws receiver tcp: worse performance than sender ws receiver udp

sender ws receiver ws: PERFECT PERFORMANCE


## Sample 
The simple_ws_receiver and simple_ws_sender provide a most simple example of how to use Node.js corelink. Regardless of starting the sender first or receiver first, the sender will only start sending if there is a receiver subscribed to the workspace

To run the simple example, run
```
npm install corelink-client
pip install tifffile
```

and inside each directory, run

``` 
npm start simple_ws_receiver.js
```
or 
```
npm start simple_ws_sender.js
```

Then your simple corelink client server is talking to each other!
