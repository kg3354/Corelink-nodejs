// const config = {
//   ControlPort: 20012,
//   ControlIP: 'corelink.hpc.nyu.edu',
//   autoReconnect: false,
// }
// const username = 'Testuser'
// const password = 'Testpassword'
// const corelink = require('corelink-client')

// const workspace = 'Fenton'
// const protocol = 'tcp'
// const datatype = 'distance'

// corelink.debug = true

// let iter = 0
// let receiverActive = false
// let sender

// function randomdata() {
//   iter++
//   console.log(iter.toString())
//   return iter.toString()
// }

// const run = async () => {
//   if (await corelink.connect({ username, password }, config).catch((err) => { console.log(err) })) {
//     sender = await corelink.createSender({
//       workspace,
//       protocol,
//       type: datatype,
//       metadata: { name: 'Random Data' },
//     }).catch((err) => { console.log(err) })

//     // Provide the sender update callback
//     corelink.on('sender', (data) => {
//       console.log('Sender update:', data)
//       if (data.receiverID) {
//         receiverActive = true
//       } else {
//         receiverActive = false
//       }
//     })

//     setInterval(async () => {
//       if (receiverActive && sender) {
//         const dataToSend = Buffer.from(randomdata());
//         for (let i = 0; i < 7; i++) {
//           await corelink.send(sender, dataToSend);
//           console.log('Data sent:', dataToSend.toString());
//           await new Promise(resolve => setTimeout(resolve, 30)); // 30 ms delay
//         }
//       }
//     }, 1000);
   
//   }
// }

// run()




// const config = {
//   ControlPort: 20012,
//   ControlIP: 'corelink.hpc.nyu.edu',
//   autoReconnect: false,
// }
// const username = 'Testuser'
// const password = 'Testpassword'
// const corelink = require('corelink-client')

// const workspace = 'Fenton'
// const protocol = 'tcp'
// const datatype = 'distance'

// corelink.debug = true

// let iter = 0
// let receiverActive = false
// let sender
// const MAX_SLICE_SIZE = 2000 // 2KB

// function generateSampleData(size) {
//   const data = Buffer.alloc(size)
//   for (let i = 0; i < size; i++) {
//     data[i] = i % 256
//   }
//   return data
// }

// function sliceFrame(frameBuffer) {
//   const slices = []
//   const totalSlices = Math.ceil(frameBuffer.length / MAX_SLICE_SIZE)
  
//   for (let i = 0; i < totalSlices; i++) {
//     const start = i * MAX_SLICE_SIZE
//     const end = Math.min(start + MAX_SLICE_SIZE, frameBuffer.length)
//     const slice = frameBuffer.slice(start, end)

//     const header = Buffer.alloc(4)
//     header.writeUInt16BE(iter, 0) // 16-bit frame number
//     header.writeUInt8(i, 2) // 8-bit slice number
//     header.writeUInt8(slice.length, 3) // 8-bit slice size

//     slices.push(Buffer.concat([header, slice]))
//     console.log(`Sending slice with header: frame:${iter}, slice:${i}, size:${slice.length}`)
//   }

//   return slices
// }

// async function sendFrame(frameBuffer) {
//   const slices = sliceFrame(frameBuffer)
//   for (const slice of slices) {
//     console.log(`Trying to send slice data of length: ${slice.length}`)
//     try {
//       await corelink.send(sender, slice)
//     } catch (err) {
//       console.error('Error sending slice:', err)
//     }
//   }
// }

// const run = async () => {
//   try {
//     const connected = await corelink.connect({ username, password }, config)
//     if (connected) {
//       sender = await corelink.createSender({
//         workspace,
//         protocol,
//         type: datatype,
//         metadata: { name: 'AVI Frame Data' },
//       })
      
//       // Provide the sender update callback
//       corelink.on('sender', (data) => {
//         console.log('Sender update:', data)
//         if (data.receiverID) {
//           receiverActive = true
//         } else {
//           receiverActive = false
//         }
//       })

//       setInterval(() => {
//         if (receiverActive && sender) {
//           const frameData = generateSampleData(367 * 1024) // Sample data for visualization
//           sendFrame(frameData)
//         }
//       }, 1000)
//     }
//   } catch (err) {
//     console.error('Error in run:', err)
//   }
// }

// run()



// const fs = require('fs');
// const path = require('path');
// const corelink = require('corelink-client');

// const config = {
//   ControlPort: 20012,
//   ControlIP: 'corelink.hpc.nyu.edu',
//   autoReconnect: false,
// };
// const username = 'Testuser';
// const password = 'Testpassword';
// const workspace = 'Fenton';
// const protocol = 'tcp';
// const datatype = 'distance';
// const CHUNK_SIZE = 2 * 1024; // 2KB chunk size

// corelink.debug = true;

// let receiverActive = false;
// let sender;
// let currentFrameNumber = 0;

// const filePath = './1.avi'; // Update with actual file path

// async function sendFile(filePath) {
//   const fileBuffer = fs.readFileSync(filePath);
//   const totalChunks = Math.ceil(fileBuffer.length / CHUNK_SIZE);

//   for (let i = 0; i < totalChunks; i++) {
//     const chunk = fileBuffer.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
//     const dataToSend = Buffer.concat([
//       Buffer.from([currentFrameNumber, i, totalChunks]), // Frame number, current chunk index, total chunks
//       chunk,
//     ]);
//     if (receiverActive) {
//       corelink.send(sender, dataToSend);
//       await new Promise(resolve => setTimeout(resolve, 30)); 
//       console.log('Chunk sent:', i, 'of frame', currentFrameNumber);
//     }
//   }
//   currentFrameNumber++;
// }

// const run = async () => {
//   try {
//     await corelink.connect({ username, password }, config);
//     sender = await corelink.createSender({
//       workspace,
//       protocol,
//       type: datatype,
//       metadata: { name: 'AVI File Sender' },
//     });

//     corelink.on('sender', (data) => {
//       if (!!data.receiverID !== receiverActive) {
//         receiverActive = !!data.receiverID;
//         console.log(`Receiver ${data.receiverID} ${receiverActive ? 'connected' : 'disconnected'}.`);
//       }
//       if (receiverActive) sendFile(filePath);
//     });
//   } catch (err) {
//     console.error('Error:', err);
//   }
// };

// run();

const fs = require('fs');
const corelink = require('corelink-client');

const config = {
  ControlPort: 20012,
  ControlIP: 'corelink.hpc.nyu.edu',
  autoReconnect: false,
};
const username = 'Testuser';
const password = 'Testpassword';
const workspace = 'Fenton';
const protocol = 'ws';
const datatype = 'distance';
const CHUNK_SIZE = 4 * 1024; // 4KB chunk size

corelink.debug = true;

let receiverActive = false;
let sender;
let currentFrameNumber = 0;

async function sendFile(filePath) {
  return new Promise((resolve, reject) => {
    const fileBuffer = fs.readFileSync(filePath);
    const totalChunks = Math.ceil(fileBuffer.length / CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
      const chunk = fileBuffer.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const dataToSend = Buffer.concat([
        Buffer.from([currentFrameNumber, i, totalChunks]), // Frame number, current chunk index, total chunks
        chunk,
      ]);
      if (receiverActive) {
        corelink.send(sender, dataToSend);
        console.log('Chunk sent:', i, 'of frame', currentFrameNumber);
      }
    }
    resolve(); // Resolve the promise once all chunks are sent
  });
}

async function sendEndMessage() {
  if (receiverActive) {
    const endMessage = Buffer.from('FINISHED');
    corelink.send(sender, endMessage);
    console.log('End message sent.');
  }
}

const run = async () => {
  try {
    await corelink.connect({ username, password }, config);
    sender = await corelink.createSender({
      workspace,
      protocol,
      type: datatype,
      metadata: { name: 'AVI File Sender' },
    });

    corelink.on('sender', async (data) => {
      if (!!data.receiverID !== receiverActive) {
        receiverActive = !!data.receiverID;
        console.log(`Receiver ${data.receiverID} ${receiverActive ? 'connected' : 'disconnected'}.`);
      }
      if (receiverActive) {
        for (let i = 0; i < 244; i++) {
          await sendFile(`./${i}.avi`); // Await here to wait for each sendFile to complete
          currentFrameNumber++;
        }
        await sendEndMessage(); // Send end message after all files are sent
      }
    });
  } catch (err) {
    console.error('Error:', err);
  }
};

run();
