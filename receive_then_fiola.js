const corelink = require('corelink-client');
const { spawn } = require('child_process');
const path = require('path');
const { PassThrough } = require('stream');
const fs = require('fs');
const { performance } = require('perf_hooks');

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

const fileParts = {};
let allFrames = [];
let frameCounter = 0;
let tiffCounter = 0;
const framesPerTiff = 500;
let frameStartTimes = {};

const run = async () => {
  try {
    await corelink.connect({ username, password }, config);
    const receiver = await corelink.createReceiver({
      workspace,
      protocol,
      type: datatype,
      echo: true,
      alert: true,
    });

    corelink.on('receiver', async (data) => {
      const options = { streamIDs: [data.streamID] };
      await corelink.subscribe(options);
      console.log('Receiver and sender connected, subscribing to data.');
    });

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

const processFramesAndGenerateTiff = async (tiffPath, frames) => {
  try {
    await sendBufferToPython(Buffer.concat(frames), tiffPath, 'generate');
    console.log(`TIFF image saved at ${tiffPath}`);
  } catch (error) {
    console.error('Error processing frames:', error);
  }
};

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

const processRemainingFrames = async () => {
  if (allFrames.length > 0) {
    const tiffPath = path.join(__dirname, `constructed_image_${tiffCounter}.tiff`);
    await processFramesAndGenerateTiff(tiffPath, allFrames.slice());
    allFrames = [];
    tiffCounter++;
  }
  console.log('Finished remaining frames, trying to combine.');
};

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
