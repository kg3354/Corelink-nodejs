const fs = require('fs');
const chokidar = require('chokidar');
const path = require('path');
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

// Function to send an end message
async function sendEndMessage() {
  if (receiverActive) {
    const endMessage = Buffer.from('FINISHED');
    corelink.send(sender, endMessage);
    console.log('End message sent.');
  }
}

// Initialize Corelink and watch for new files
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
    });

    // Watch directory from environment variable or default
    const watchDir = process.env.WATCH_DIR || "C:/Users/Research/Desktop/temp/GarrettBlair/PKCZ_imaging/test";
    
    const watcher = chokidar.watch(watchDir, {
      persistent: true,
      ignoreInitial: true,
      followSymlinks: false,
      depth: 3,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100,
      },
      usePolling: true,
    });

    // Event listener for new files
    watcher.on('add', async (filePath) => {
      if (path.extname(filePath).toLowerCase() === '.avi') {
        console.log(`New video file detected: ${filePath}`);
        if (receiverActive) {
          await sendFile(filePath);
          currentFrameNumber++;
          await sendEndMessage(); // Send end message after each file is sent
        } else {
          console.log('Receiver not active. Skipping file:', filePath);
        }
      }
    });

    console.log(`Watching for new .avi files in ${watchDir}`);
  } catch (err) {
    console.error('Error:', err);
  }
};

run();
