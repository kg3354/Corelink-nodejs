
// // // // const corelink = require('corelink-client');
// // // // const fs = require('fs');
// // // // const config = {
// // // //   ControlPort: 20012,
// // // //   ControlIP: 'corelink.hpc.nyu.edu',
// // // //   autoReconnect: false,
// // // // };
// // // // const username = 'Testuser';
// // // // const password = 'Testpassword';
// // // // const workspace = 'Fenton';
// // // // const protocol = 'ws';
// // // // const datatype = 'distance';

// // // // const fileParts = {};
// // // // counter = 0
// // // // const run = async () => {
// // // //   if (await corelink.connect({ username, password }, config).catch((err) => { console.log(err) })) {
// // // //     const receiver = await corelink.createReceiver({
// // // //       workspace, 
// // // //       protocol, 
// // // //       type: datatype, 
// // // //       echo: true, 
// // // //       alert: true,
// // // //     }).catch((err) => { console.log(err) });

// // // //     corelink.on('receiver', async (data) => {
// // // //       const options = { streamIDs: [data.streamID] };
// // // //       await corelink.subscribe(options);
// // // //       console.log('Receiver and sender connected, subscribing to data.');
// // // //     });


// // // //     corelink.on('data', (streamID, data) => {
// // // //       // console.log(`received data: ${data}`)
// // // //       const frameNumber = data[0];
// // // //       const sliceIndex = data[1];
// // // //       const totalSlices = data[2];
// // // //       const content = data.slice(3);
// // // //       console.log(`Frame number ${frameNumber} and slice number ${sliceIndex}`)
// // // //       if (!fileParts[frameNumber]) {
// // // //         fileParts[frameNumber] = new Array(totalSlices).fill(null);
// // // //       }

// // // //       fileParts[frameNumber][sliceIndex] = content;

// // // //       // Check if all parts are received
// // // //       if (fileParts[frameNumber].every(part => part !== null)) {
// // // //         const fullFile = Buffer.concat(fileParts[frameNumber]);
// // // //         fs.writeFileSync(`output-${frameNumber}.avi`, fullFile);
// // // //         console.log(`Frame ${frameNumber} reassembled and saved.`);
// // // //       }
// // // //     });
// // // //   }
// // // // };

// // // // run();
// const corelink = require('corelink-client');
// const { spawn } = require('child_process');
// const config = {
//   ControlPort: 20012,
//   ControlIP: 'corelink.hpc.nyu.edu',
//   autoReconnect: false,
// };
// const username = 'Testuser';
// const password = 'Testpassword';
// const workspace = 'Fenton';
// const protocol = 'ws';
// const datatype = 'distance';

// const fileParts = {};
// let allFrames = [];
// counter = 0;

// const run = async () => {
//   if (await corelink.connect({ username, password }, config).catch((err) => { console.log(err) })) {
//     const receiver = await corelink.createReceiver({
//       workspace,
//       protocol,
//       type: datatype,
//       echo: true,
//       alert: true,
//     }).catch((err) => { console.log(err) });

//     corelink.on('receiver', async (data) => {
//       const options = { streamIDs: [data.streamID] };
//       await corelink.subscribe(options);
//       console.log('Receiver and sender connected, subscribing to data.');
//     });

//     corelink.on('data', (streamID, data) => {
//       if (data.toString() === 'FINISHED') {
//         console.log('Received FINISHED marker.');
//         sendFramesToPython(allFrames);
//         allFrames = [];
//       } else {
//         const frameNumber = data[0];
//         const sliceIndex = data[1];
//         const totalSlices = data[2];
//         const content = data.slice(3);
//         console.log(`Frame number ${frameNumber} and slice number ${sliceIndex}`)
//         if (!fileParts[frameNumber]) {
//           fileParts[frameNumber] = new Array(totalSlices).fill(null);
//         }

//         fileParts[frameNumber][sliceIndex] = content;

//         // Check if all parts are received
//         if (fileParts[frameNumber].every(part => part !== null)) {
//           const fullFile = Buffer.concat(fileParts[frameNumber]);
//           console.log(`Frame ${frameNumber} reassembled.`);

//           // Store the reassembled frame
//           allFrames.push(fullFile);
//         }
//       }
//     });
//   }
// };

// const sendFramesToPython = (frames) => {
//   const pythonProcess = spawn('python', ['image_process.py']);

//   pythonProcess.stdin.write(Buffer.concat(frames));
//   pythonProcess.stdin.end();

//   pythonProcess.stdout.on('data', (data) => {
//     console.log(`Python output: ${data}`);
//   });

//   pythonProcess.stderr.on('data', (data) => {
//     console.error(`Python error: ${data}`);
//   });

//   pythonProcess.on('close', (code) => {
//     console.log(`Python script finished with code ${code}`);
//   });
// };

// run();
// // const corelink = require('corelink-client');
// // const { spawn } = require('child_process');
// // const config = {
// //   ControlPort: 20012,
// //   ControlIP: 'corelink.hpc.nyu.edu',
// //   autoReconnect: false,
// // };
// // const username = 'Testuser';
// // const password = 'Testpassword';
// // const workspace = 'Fenton';
// // const protocol = 'ws';
// // const datatype = 'distance';

// // const fileParts = {};
// // let buffers = [[], []];
// // let currentBufferIndex = 0;
// // let frameCounter = 0;
// // const maxFramesPerBuffer = 150;

// // const run = async () => {
// //   if (await corelink.connect({ username, password }, config).catch((err) => { console.log(err) })) {
// //     const receiver = await corelink.createReceiver({
// //       workspace,
// //       protocol,
// //       type: datatype,
// //       echo: true,
// //       alert: true,
// //     }).catch((err) => { console.log(err) });

// //     corelink.on('receiver', async (data) => {
// //       const options = { streamIDs: [data.streamID] };
// //       await corelink.subscribe(options);
// //       console.log('Receiver and sender connected, subscribing to data.');
// //     });

// //     corelink.on('data', (streamID, data) => {
// //       if (data.toString() === 'FINISHED') {
// //         console.log('Received FINISHED marker.');
// //         sendFramesToPython(buffers[currentBufferIndex]);
// //         buffers[currentBufferIndex] = [];  // Clear the current buffer
// //         currentBufferIndex = 1 - currentBufferIndex;  // Switch buffer
// //       } else {
// //         const frameNumber = data[0];
// //         const sliceIndex = data[1];
// //         const totalSlices = data[2];
// //         const content = data.slice(3);
// //         console.log(`Frame number ${frameNumber} and slice number ${sliceIndex}`)
// //         if (!fileParts[frameNumber]) {
// //           fileParts[frameNumber] = new Array(totalSlices).fill(null);
// //         }

// //         fileParts[frameNumber][sliceIndex] = content;

// //         // Check if all parts are received
// //         if (fileParts[frameNumber].every(part => part !== null)) {
// //           const fullFile = Buffer.concat(fileParts[frameNumber]);
// //           console.log(`Frame ${frameNumber} reassembled.`);

// //           // Store the reassembled frame
// //           buffers[currentBufferIndex].push(fullFile);
// //           frameCounter++;

// //           if (frameCounter >= maxFramesPerBuffer) {
// //             sendFramesToPython(buffers[currentBufferIndex]);
// //             buffers[currentBufferIndex] = [];  // Clear the current buffer
// //             currentBufferIndex = 1 - currentBufferIndex;  // Switch buffer
// //             frameCounter = 0;
// //           }
// //         }
// //       }
// //     });
// //   }
// // };

// // const sendFramesToPython = (frames) => {
// //   const pythonProcess = spawn('python', ['image_process.py']);

// //   pythonProcess.stdin.write(Buffer.concat(frames));
// //   pythonProcess.stdin.end();

// //   pythonProcess.stdout.on('data', (data) => {
// //     console.log(`Python output: ${data}`);
// //   });

// //   pythonProcess.stderr.on('data', (data) => {
// //     console.error(`Python error: ${data}`);
// //   });

// //   pythonProcess.on('close', (code) => {
// //     console.log(`Python script finished with code ${code}`);
// //   });
// // };

// // run();
// // const corelink = require('corelink-client');
// // const { spawn } = require('child_process');
// // const config = {
// //   ControlPort: 20012,
// //   ControlIP: 'corelink.hpc.nyu.edu',
// //   autoReconnect: false,
// // };
// // const username = 'Testuser';
// // const password = 'Testpassword';
// // const workspace = 'Fenton';
// // const protocol = 'ws';
// // const datatype = 'distance';

// // const fileParts = {};
// // let buffers = [[], []];
// // let currentBufferIndex = 0;
// // let frameCounter = 0;
// // const maxFramesPerBuffer = 150;

// // const run = async () => {
// //   if (await corelink.connect({ username, password }, config).catch((err) => { console.log(err) })) {
// //     const receiver = await corelink.createReceiver({
// //       workspace,
// //       protocol,
// //       type: datatype,
// //       echo: true,
// //       alert: true,
// //     }).catch((err) => { console.log(err) });

// //     corelink.on('receiver', async (data) => {
// //       const options = { streamIDs: [data.streamID] };
// //       await corelink.subscribe(options);
// //       console.log('Receiver and sender connected, subscribing to data.');
// //     });

// //     corelink.on('data', (streamID, data) => {
// //       if (data.toString() === 'FINISHED') {
// //         console.log('Received FINISHED marker.');
// //         sendFramesToPython(buffers[currentBufferIndex]);
// //         buffers[currentBufferIndex] = [];  // Clear the current buffer
// //         currentBufferIndex = 1 - currentBufferIndex;  // Switch buffer
// //       } else {
// //         const frameNumber = data.readUInt32BE(0); // Read 4 bytes for the frame number
// //         const sliceIndex = data[4];
// //         const totalSlices = data[5];
// //         const content = data.slice(6);
// //         console.log(`Frame number ${frameNumber} and slice number ${sliceIndex}`);
// //         if (!fileParts[frameNumber]) {
// //           fileParts[frameNumber] = new Array(totalSlices).fill(null);
// //         }

// //         fileParts[frameNumber][sliceIndex] = content;

// //         // Check if all parts are received
// //         if (fileParts[frameNumber].every(part => part !== null)) {
// //           const fullFile = Buffer.concat(fileParts[frameNumber]);
// //           console.log(`Frame ${frameNumber} reassembled.`);

// //           // Store the reassembled frame
// //           buffers[currentBufferIndex].push(fullFile);
// //           frameCounter++;

// //           if (frameCounter >= maxFramesPerBuffer) {
// //             sendFramesToPython(buffers[currentBufferIndex]);
// //             buffers[currentBufferIndex] = [];  // Clear the current buffer
// //             currentBufferIndex = 1 - currentBufferIndex;  // Switch buffer
// //             frameCounter = 0;
// //           }
// //         }
// //       }
// //     });
// //   }
// // };

// // const sendFramesToPython = (frames) => {
// //   const pythonProcess = spawn('python', ['image_process.py']);

// //   pythonProcess.stdin.write(Buffer.concat(frames));
// //   pythonProcess.stdin.end();

// //   pythonProcess.stdout.on('data', (data) => {
// //     console.log(`Python output: ${data}`);
// //   });

// //   pythonProcess.stderr.on('data', (data) => {
// //     console.error(`Python error: ${data}`);
// //   });

// //   pythonProcess.on('close', (code) => {
// //     console.log(`Python script finished with code ${code}`);
// //   });
// // };

// // run();
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
      const frameNumberBuffer = Buffer.alloc(2);
      frameNumberBuffer.writeUInt16BE(currentFrameNumber, 0);
      const dataToSend = Buffer.concat([
        frameNumberBuffer, // Frame number (2 bytes)
        Buffer.from([i, totalChunks]), // Current chunk index and total chunks
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
      }
    });
  } catch (err) {
    console.error('Error:', err);
  }
};

run();

