

// // const fs = require('fs');
// // const corelink = require('corelink-client');

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
// // const CHUNK_SIZE = 4 * 1024; // 4KB chunk size

// // corelink.debug = true;

// // let receiverActive = false;
// // let sender;
// // let currentFrameNumber = 0;

// // async function sendFile(filePath) {
// //   return new Promise((resolve, reject) => {
// //     const fileBuffer = fs.readFileSync(filePath);
// //     const totalChunks = Math.ceil(fileBuffer.length / CHUNK_SIZE);

// //     for (let i = 0; i < totalChunks; i++) {
// //       const chunk = fileBuffer.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
// //       const dataToSend = Buffer.concat([
// //         Buffer.from([currentFrameNumber, i, totalChunks]), // Frame number, current chunk index, total chunks
// //         chunk,
// //       ]);
// //       if (receiverActive) {
// //         corelink.send(sender, dataToSend);
// //         console.log('Chunk sent:', i, 'of frame', currentFrameNumber);
// //       }
// //     }
// //     resolve(); // Resolve the promise once all chunks are sent
// //   });
// // }

// // async function sendEndMessage() {
// //   if (receiverActive) {
// //     const endMessage = Buffer.from('FINISHED');
// //     corelink.send(sender, endMessage);
// //     console.log('End message sent.');
// //   }
// // }

// // const run = async () => {
// //   try {
// //     await corelink.connect({ username, password }, config);
// //     sender = await corelink.createSender({
// //       workspace,
// //       protocol,
// //       type: datatype,
// //       metadata: { name: 'AVI File Sender' },
// //     });

// //     corelink.on('sender', async (data) => {
// //       if (!!data.receiverID !== receiverActive) {
// //         receiverActive = !!data.receiverID;
// //         console.log(`Receiver ${data.receiverID} ${receiverActive ? 'connected' : 'disconnected'}.`);
// //       }
// //       if (receiverActive) {
// //         for (let i = 0; i < 244; i++) {
// //           await sendFile(`./${i}.avi`); // Await here to wait for each sendFile to complete
// //           currentFrameNumber++;
// //         }
// //         await sendEndMessage(); // Send end message after all files are sent
// //       }
// //     });
// //   } catch (err) {
// //     console.error('Error:', err);
// //   }
// // };

// // run();

// const fs = require('fs');
// const corelink = require('corelink-client');

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
// const CHUNK_SIZE = 4 * 1024; // 4KB chunk size

// corelink.debug = true;

// let receiverActive = false;
// let sender;
// let currentFrameNumber = 0;

// async function sendFile(filePath) {
//   return new Promise((resolve, reject) => {
//     const fileBuffer = fs.readFileSync(filePath);
//     const totalChunks = Math.ceil(fileBuffer.length / CHUNK_SIZE);

//     for (let i = 0; i < totalChunks; i++) {
//       const chunk = fileBuffer.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
//       const dataToSend = Buffer.concat([
//         Buffer.alloc(4, currentFrameNumber), // Use 4 bytes to encode the frame number
//         Buffer.from([i, totalChunks]), // Current chunk index and total chunks
//         chunk,
//       ]);
//       if (receiverActive) {
//         corelink.send(sender, dataToSend);
//         console.log('Chunk sent:', i, 'of frame', currentFrameNumber);
//       }
//     }
//     resolve(); // Resolve the promise once all chunks are sent
//   });
// }

// async function sendEndMessage() {
//   if (receiverActive) {
//     const endMessage = Buffer.from('FINISHED');
//     corelink.send(sender, endMessage);
//     console.log('End message sent.');
//   }
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

//     corelink.on('sender', async (data) => {
//       if (!!data.receiverID !== receiverActive) {
//         receiverActive = !!data.receiverID;
//         console.log(`Receiver ${data.receiverID} ${receiverActive ? 'connected' : 'disconnected'}.`);
//       }
//       if (receiverActive) {
//         for (let i = 0; i < 244; i++) {
//           await sendFile(`./${i}.avi`); // Await here to wait for each sendFile to complete
//           currentFrameNumber++;
//         }
//         await sendEndMessage(); // Send end message after all files are sent
//       }
//     });
//   } catch (err) {
//     console.error('Error:', err);
//   }
// };

// // run();
// const fs = require('fs');
// const corelink = require('corelink-client');

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
// const CHUNK_SIZE = 4 * 1024; // 4KB chunk size

// corelink.debug = true;

// let receiverActive = false;
// let sender;
// let currentFrameNumber = 0;

// async function sendFile(filePath) {
//   return new Promise((resolve, reject) => {
//     const fileBuffer = fs.readFileSync(filePath);
//     const totalChunks = Math.ceil(fileBuffer.length / CHUNK_SIZE);

//     for (let i = 0; i < totalChunks; i++) {
//       const chunk = fileBuffer.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
//       const frameNumberBuffer = Buffer.alloc(2);
//       frameNumberBuffer.writeUInt8(currentFrameNumber >> 8, 0); // First byte
//       frameNumberBuffer.writeUInt8(currentFrameNumber & 0xFF, 1); // Second byte
//       const dataToSend = Buffer.concat([
//         frameNumberBuffer, // Frame number (2 bytes)
//         Buffer.from([i, totalChunks]), // Current chunk index and total chunks
//         chunk,
//       ]);
//       if (receiverActive) {
//         corelink.send(sender, dataToSend);
//         console.log('Chunk sent:', i, 'of frame', currentFrameNumber);
//       }
//     }
//     resolve(); // Resolve the promise once all chunks are sent
//   });
// }

// async function sendEndMessage() {
//   if (receiverActive) {
//     const endMessage = Buffer.from('FINISHED');
//     corelink.send(sender, endMessage);
//     console.log('End message sent.');
//   }
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

//     corelink.on('sender', async (data) => {
//       if (!!data.receiverID !== receiverActive) {
//         receiverActive = !!data.receiverID;
//         console.log(`Receiver ${data.receiverID} ${receiverActive ? 'connected' : 'disconnected'}.`);
//       }
//       if (receiverActive) {
//         for (let i = 0; i < 244; i++) {
//           await sendFile(`./${i}.avi`); // Await here to wait for each sendFile to complete
//           currentFrameNumber++;
//         }
//         await sendEndMessage(); // Send end message after all files are sent
//       }
//     });
//   } catch (err) {
//     console.error('Error:', err);
//   }
// };

// run();


const fs = require('fs');
const corelink = require('corelink-client');
const util = require('util');
const sleep = util.promisify(setTimeout);

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
  return new Promise(async (resolve, reject) => {
    const fileBuffer = fs.readFileSync(filePath);
    const totalChunks = Math.ceil(fileBuffer.length / CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
      const chunk = fileBuffer.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const frameNumberBuffer = Buffer.alloc(2);
      frameNumberBuffer.writeUInt8(currentFrameNumber >> 8, 0); // First byte
      frameNumberBuffer.writeUInt8(currentFrameNumber & 0xFF, 1); // Second byte
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

async function sendEndMessage() {
  if (receiverActive) {
    const endMessage = Buffer.from('FINISHED');
    corelink.send(sender, endMessage);
    console.log('End message sent.');
  }
}

const startSendingFiles = async () => {
  for (let i = 0; i < 1300; i++) {
    await sendFile(`./${i}.avi`); // Await here to wait for each sendFile to complete
    currentFrameNumber++;
    if (i % 90 == 0){
      await sleep(10); // Introduce a small delay between chunks to allow real-time processing
    }
  }
  await sendEndMessage(); // Send end message after all files are sent
};

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
        await startSendingFiles(); // Await here to ensure the sending process completes before continuing
      }
    });
  } catch (err) {
    console.error('Error:', err);
  }
};

run();
