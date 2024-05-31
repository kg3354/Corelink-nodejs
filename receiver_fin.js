
// const corelink = require('corelink-client');
// const fs = require('fs');
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
// counter = 0
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
//       // console.log(`received data: ${data}`)
//       const frameNumber = data[0];
//       const sliceIndex = data[1];
//       const totalSlices = data[2];
//       const content = data.slice(3);
//       console.log(`Frame number ${frameNumber} and slice number ${sliceIndex}`)
//       if (!fileParts[frameNumber]) {
//         fileParts[frameNumber] = new Array(totalSlices).fill(null);
//       }

//       fileParts[frameNumber][sliceIndex] = content;

//       // Check if all parts are received
//       if (fileParts[frameNumber].every(part => part !== null)) {
//         const fullFile = Buffer.concat(fileParts[frameNumber]);
//         fs.writeFileSync(`output-${frameNumber}.avi`, fullFile);
//         console.log(`Frame ${frameNumber} reassembled and saved.`);
//       }
//     });
//   }
// };

// run();
const corelink = require('corelink-client');
const { spawn } = require('child_process');
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
        sendFramesToPython(allFrames);
        allFrames = [];
      } else {
        const frameNumber = data[0];
        const sliceIndex = data[1];
        const totalSlices = data[2];
        const content = data.slice(3);
        console.log(`Frame number ${frameNumber} and slice number ${sliceIndex}`)
        if (!fileParts[frameNumber]) {
          fileParts[frameNumber] = new Array(totalSlices).fill(null);
        }

        fileParts[frameNumber][sliceIndex] = content;

        // Check if all parts are received
        if (fileParts[frameNumber].every(part => part !== null)) {
          const fullFile = Buffer.concat(fileParts[frameNumber]);
          console.log(`Frame ${frameNumber} reassembled.`);

          // Store the reassembled frame
          allFrames.push(fullFile);
        }
      }
    });
  }
};

const sendFramesToPython = (frames) => {
  const pythonProcess = spawn('python', ['image_process.py']);

  pythonProcess.stdin.write(Buffer.concat(frames));
  pythonProcess.stdin.end();

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
