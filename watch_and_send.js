/**
 *  The Corelink Sender logic, utilizing chokidar to watch for new AVI frames generated by Miniscope, and send to 
 *  Corelink raw image workspace. Each frame is sent as a chunk, with a 2-byte frame number, a 1-byte chunk index, and 1 byte for total chunks.
 *  After sending all chunks of the current frame, an END_FRAME message will be sent. If there is one second of inactivity, the sender will
 *  be indicated as stale, thus sending a FINISHED message to Corelink. 
 * 
 *  Author: Kaiwen Guo 
 */


// Importing required libraries and path. 
const fs = require('fs');
const chokidar = require('chokidar');
const path = require('path');
const corelink = require('corelink-client');

// Initializing the configurations required to use Corelink service. 
const config = {
  ControlPort: 20012,
  ControlIP: 'corelink.hpc.nyu.edu',
  autoReconnect: false,
};

// Configurations for the Corelink sender.
const username = 'Testuser';
const password = 'Testpassword';
const workspace = 'Fenton';
const protocol = 'ws';
const datatype = 'video';
const CHUNK_SIZE = 4 * 1024; // 4KB chunk size

// Should be set to false for production. 
corelink.debug = true;

// Initialization parameters that will be used.
let receiverActive = false;
let sender;
let currentFrameNumber = 0;
let inactiveTimeout;

/**
 * Async function to send a file in chunks. Each chunk starts with a 2-byte frame number, followed by a 1-byte chunk index and 1-byte total chunk number,
 * then followed by the chunk data itself.
 * @param {String} filePath The file path of the file to be sent via Corelink.
 */
async function sendFile(filePath) {
  
  return new Promise((resolve, reject) => {
    // Using the async read file function from fs
    fs.readFile(filePath, (err, fileBuffer) => {
      if (err) return reject(err);

      const totalChunks = Math.ceil(fileBuffer.length / CHUNK_SIZE);
      // Sending each chunk of the file. The first 2 bytes of each chunk is reservef for the frame number, and the next two bytes indicate the chunk number and
      // total chunk, and then is the chunk data itself if there is an active receiver.
      for (let i = 0; i < totalChunks; i++) {
        const chunk = fileBuffer.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        const frameNumberBuffer = Buffer.alloc(2);
        frameNumberBuffer.writeUInt8(currentFrameNumber >> 8, 0);
        frameNumberBuffer.writeUInt8(currentFrameNumber & 0xFF, 1);
        const dataToSend = Buffer.concat([
          frameNumberBuffer,
          Buffer.from([i, totalChunks]),
          chunk,
        ]);

        if (receiverActive) {
          corelink.send(sender, dataToSend);
          console.log('Chunk sent:', i, 'of frame', currentFrameNumber);
        }
      }
      resolve();
    });
  });
}


/**
 * Sends an end message indicating no more frames will be sent.
 */
async function sendEndMessage() {
  if (receiverActive) {
    const endMessage = Buffer.from('FINISHED');
    corelink.send(sender, endMessage);
    console.log('End message sent.');
  }
}

/**
 * Initializes Corelink sender and chokidar watcher, when new video files are written to disk, the chokidar watcher will retrive that file path 
 * and calls sendFile function to send. 
 */
const run = async () => {
  try {
    // A Corelink Sender will be created via Corelionk createSender function, and when there is a valid receiver
    // in the same workspace, the receiverActive will be set to true, thus enables the sender to send. 
    await corelink.connect({ username, password }, config);
    sender = await corelink.createSender({
      workspace,
      protocol,
      type: datatype,
      metadata: { name: 'AVI File Sender' },
    });
    // When receives a sender call back from the Corelink server, receiverActice will be set to true and thus enables the sender to send.
    corelink.on('sender', async (data) => {
      if (!!data.receiverID !== receiverActive) {
        receiverActive = !!data.receiverID;
        console.log(`Receiver ${data.receiverID} ${receiverActive ? 'connected' : 'disconnected'}.`);
      }
    });

    // Watch directory from environment variable or default
    const watchDir = process.env.WATCH_DIR || "C:/Users/Research/Desktop/temp/GarrettBlair/PKCZ_imaging/test";

    // Initialization of the chokidar watcher. Please note that depth is required, as Miniscope writes to a directoy 3 levels down from the watch directory.
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

    // When the chokidar watcher captures a new AVI file written to one of its watching directories, it clears the time out and send that
    // captured avi file using the sendFile function. No new avi file being written to disk in one second after the last captured file, then
    // the time out will trigger the sendEndMessage function, which indicates the end of capture. 
    watcher.on('add', async (filePath) => {
      if (path.extname(filePath).toLowerCase() === '.avi') {
        console.log(`New video file detected: ${filePath}`);
        clearTimeout(inactiveTimeout);
    
        if (receiverActive) {
          sendFile(filePath).then(() => {
            currentFrameNumber++;
          }).catch(err => {
            console.error('Failed to send file:', err);
          });
        } else {
          console.log('Receiver not active. Skipping file:', filePath);
        }
    
        inactiveTimeout = setTimeout(async () => {
          await sendEndMessage();
        }, 1000);
      }
    });
    
    console.log(`Watching for new .avi files in ${watchDir}`);
  } catch (err) {
    console.error('Error:', err);
  }
};

run();
