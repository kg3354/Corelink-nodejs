/**
 *  The Corelink receiver logic, it receives the chunks of AVI Files and assembles them to valid frames again. Without sending 
 *  Without saving to disk, use a buffer to store the assembled frames and then pass the buffer to a child Python process to 
 *  combine to one large TIFF FIle. The Python child process is responsible for combining video frames and calling the FIOLA pipeline.
 *  Currently logging the time from receiving the first chunk of a frame to the last chunk of the same frame to console, and logging the 
 *  time until receiving the FINISHED message. 
 * 
 *  Author: Kaiwen Guo 
 */

// Importing required libraries and path. 
const corelink = require('corelink-client');
const { spawn } = require('child_process');
const path = require('path');
const { PassThrough } = require('stream');
const fs = require('fs');
const { performance } = require('perf_hooks');

// Initializing the configurations required to use Corelink service. 
const config = {
  ControlPort: 20012,
  ControlIP: 'corelink.hpc.nyu.edu',
  autoReconnect: false,
};


// Configurations for the Corelink receiver.
const username = 'Testuser';
const password = 'Testpassword';
const workspace = 'Fenton';
const protocol = 'ws';
const datatype = 'video';

// Initialization parameters that will be used.
const fileParts = {};
let allFrames = [];
let frameCounter = 0;
let tiffCounter = 0;
const framesPerTiff = 500;
let frameStartTimes = {};

/**
 * The async run function that first connect with client at the specified Port and IP number after verifying login credentials 
 * like username, password and token defined in the 'login' function. Then creates a Corelink receiver using the given praraeters that subscribes
 * to the corresponding workspace. When the receiver receives data from the Corelink workspace, if the data is FINISHED, then indicate the current
 * session has ended by calling the processRemainingFrames and combineTiffs function. Otherwise, simply calls the processData function.
 * 
 */
const run = async () => {
  try {
    // Creates a corelink receiver based on specific parameters.
    await corelink.connect({ username, password }, config);
    const receiver = await corelink.createReceiver({
      workspace,
      protocol,
      type: datatype,
      echo: true,
      alert: true,
    });

    // Subscribes to the streamID if there is a valid sender in the same workspace
    corelink.on('receiver', async (data) => {
      const options = { streamIDs: [data.streamID] };
      await corelink.subscribe(options);
      console.log('Receiver and sender connected, subscribing to data.');
    });

    // When receiver receives data, it checks if the data is FINISHED in string notation. If so, the current session is considered as ended, and
    // processRemainingFrames and combineTiffs function are being called. Otherwise, simply calls the processData function.
    corelink.on('data', (streamID, data) => {
      if (data.toString() === 'FINISHED') {
        console.log('Received FINISHED marker.');
        processRemainingFrames().then(() => combineTiffs(tiffCounter));
      } else {
        processData(data);
      }
    });
  } catch (err) {
    console.log('Error connecting to Corelink:', err);
  }
};
/**
 * 
 * The processData function will read the first 4 bytes of the data chunk. The first 2 bytes of each chunk is reservef for the frame number, and the next
 * two bytes indicate the chunk number andtotal chunk, and then is the chunk data itself. If the frame number is not in the fileParts array, a new array 
 * with a size of slice number will be created and initialized to null. Then the slice received will be placed into the frame array until it is full. When
 * the frame array is full, it will be pushed to the allFrames array, which stores full video frame data. 
 * 
 * @param {*} data Raw image data chunks received by the Corelink receiver. The first 2 bytes of each chunk is reservef for the frame number, and the next
 * two bytes indicate the chunk number andtotal chunk, and then is the chunk data itself.
 */
const processData = (data) => {
  try {
    const frameNumber = (data.readUInt8(0) << 8) | data.readUInt8(1);
    const sliceIndex = data[2];
    const totalSlices = data[3];
    const content = data.slice(4);

    if (!fileParts[frameNumber]) {
      fileParts[frameNumber] = new Array(totalSlices).fill(null);
      frameStartTimes[frameNumber] = performance.now();  // Start timer for new frame
    }

    fileParts[frameNumber][sliceIndex] = content;

    if (fileParts[frameNumber].every(part => part !== null)) {
      const endTime = performance.now();
      const timeTaken = endTime - frameStartTimes[frameNumber];
      console.log(`Frame ${frameNumber} reassembled in ${timeTaken.toFixed(2)} ms.`);

      const fullFile = Buffer.concat(fileParts[frameNumber]);
      allFrames.push(fullFile);
      frameCounter++;

      if (frameCounter % framesPerTiff === 0) {
        const tiffPath = path.join(__dirname, `constructed_image_${tiffCounter}.tiff`);
        processFramesAndGenerateTiff(tiffPath, allFrames.slice());
        allFrames = [];
        tiffCounter++;
      }
    }
  } catch (error) {
    console.error(`Error processing frame ${frameNumber}:`, error);
    delete fileParts[frameNumber]; // Ensure corrupted frames don't linger in memory
  }
};

/**
 * Reserved for additional data processing. Currently does not contain any processing, calls sendBufferToPython with mode 'generate' directly.
 * 
 * @param {string} tiffPath - The file path where the TIFF image will be saved.
 * @param {Buffer[]} frames - An array of Buffer objects containing frame data.
*/
const processFramesAndGenerateTiff = async (tiffPath, frames) => {
  try {
    await sendBufferToPython(Buffer.concat(frames), tiffPath, 'generate');
    console.log(`TIFF image saved at ${tiffPath}`);
  } catch (error) {
    console.error('Error processing frames:', error);
  }
};

/**
 * Sends the current processed frames to the Python Script, which will generate a uncompressed TIFF file. The frames are delivered using 
 * buffer, to avoid unnecessary disk I/O.
 * 
 * @param {*} buffer A buffer contianing all the frames
 * @param {*} tiffPath The result path for the python script to write to
 * @param {string} mode String notation of either 'generate' or 'combine', indicating different tasks for the Python process to complete 
 * @param {*} extraData Reserved for extraData if needed.
 * @returns 
 */
const sendBufferToPython = (buffer, tiffPath, mode, extraData = '') => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', ['convert_avi_to_tiff.py', tiffPath, mode, extraData]);

    pythonProcess.stdout.on('data', (data) => {
      console.log(`Python output: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      console.log(`Python script finished with code ${code}`);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Python script exited with code ${code}`));
      }
    });

    if (mode === 'generate') {
      const stream = new PassThrough();
      stream.end(buffer);
      stream.pipe(pythonProcess.stdin);
    }
  });
};


/**
 * When received the finish message from the sender, the remaining frames are being processed and generated a tiff file by calling
 * the processFramesAndGenerateTiff function.
 */
const processRemainingFrames = async () => {
  if (allFrames.length > 0) {
    const tiffPath = path.join(__dirname, `constructed_image_${tiffCounter}.tiff`);
    await processFramesAndGenerateTiff(tiffPath, allFrames.slice());
    allFrames = [];
    tiffCounter++;
  }
  console.log('Finished remaining frames, trying to combine.');
};

/**
 * Combining all the tiff files by spawning the Python process in combine mode. The tiffCount is passed to the python process to ensure all tiff
 * files are combined sequencially.
 * @param {int} tiffCount The count of all assmebled tiff files.
 */
const combineTiffs = async (tiffCount) => {
  console.log(`Started combining, total tiffPath ${tiffCount}`);
  try {
    const combinedTiffPath = path.join(__dirname, 'final_combined_image.tiff');
    const tiffPaths = [];

    for (let i = 0; i < tiffCount; i++) {
      tiffPaths.push(path.join(__dirname, `constructed_image_${i}.tiff`));
    }

    const pythonProcess = spawn('python', ['convert_avi_to_tiff.py', combinedTiffPath, 'combine']);

    pythonProcess.stdout.on('data', (data) => {
      console.log(`Python output: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      console.log(`Python script finished with code ${code}`);
      if (code === 0) {
        console.log(`Combined TIFF image saved at ${combinedTiffPath}`);
      } else {
        console.error('Error combining TIFF files.');
      }
    });

    pythonProcess.stdin.write(JSON.stringify(tiffPaths));
    pythonProcess.stdin.end();
  } catch (error) {
    console.error('Error combining TIFF files:', error);
  }
};

// Start the corelink process
run();
