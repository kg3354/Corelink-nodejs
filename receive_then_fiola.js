const corelink = require('corelink-client');
const { spawn } = require('child_process');
const Jimp = require('jimp');
const nj = require('numjs');
const fs = require('fs');

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
counter = 0;

const run = async () => {
  if (await corelink.connect({ username, password }, config).catch((err) => { console.log(err) })) {
    const receiver = await corelink.createReceiver({
      workspace,
      protocol,
      type: datatype,
      echo: true,
      alert: true,
    }).catch((err) => { console.log(err) });

    corelink.on('receiver', async (data) => {
      const options = { streamIDs: [data.streamID] };
      await corelink.subscribe(options);
      console.log('Receiver and sender connected, subscribing to data.');
    });

    corelink.on('data', (streamID, data) => {
      if (data.toString() === 'FINISHED') {
        console.log('Received FINISHED marker.');
        saveAsTiff(allFrames, 'output.tiff').then(() => {
          allFrames = [];
          callFiolaPipeline('output.tiff');
        });
      } else {
        const frameNumber = data[0];
        const sliceIndex = data[1];
        const totalSlices = data[2];
        const content = data.slice(3);
        console.log(`Frame number ${frameNumber} and slice number ${sliceIndex}`);
        if (!fileParts[frameNumber]) {
          fileParts[frameNumber] = new Array(totalSlices).fill(null);
        }

        fileParts[frameNumber][sliceIndex] = content;

        // Check if all parts are received
        if (fileParts[frameNumber].every(part => part !== null)) {
          const fullFile = Buffer.concat(fileParts[frameNumber]);
          console.log(`Frame ${frameNumber} reassembled.`);

          // Process the reassembled frame
          processFrame(fullFile);
        }
      }
    });
  }
};

const processFrame = (frameBuffer) => {
  Jimp.read(frameBuffer)
    .then(image => {
      const { data, width, height } = image.bitmap;
      const frameArray = nj.uint8(data).reshape(height, width, 4); // Assuming RGBA format
      allFrames.push(frameArray);
    })
    .catch(err => {
      console.error('Error processing frame:', err);
    });
};

const saveAsTiff = async (frames, outputPath) => {
  // Convert frames to uint8 array for TIFF encoding
  const frameData = frames.map(frame => frame.flatten().tolist());
  const tiffBuffer = Buffer.concat(frameData.map(data => Buffer.from(data)));

  fs.writeFileSync(outputPath, tiffBuffer);
  console.log(`TIFF image saved at ${outputPath}`);
};

const callFiolaPipeline = (tiffPath) => {
  const pythonProcess = spawn('python', ['fiola_pipeline.py', tiffPath]);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python output: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python error: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python script finished with code ${code}`);
  });
};

run();