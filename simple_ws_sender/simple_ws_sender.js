const config = {
  ControlPort: 20012,
  ControlIP: 'corelink.hpc.nyu.edu',
  autoReconnect: false,
}
const username = 'Testuser'
const password = 'Testpassword'
const corelink = require('corelink-client')

const workspace = 'Fenton'
const protocol = 'ws'
const datatype = 'distance'

corelink.debug = true

let iter = 0
let receiverActive = false
let sender

function randomdata() {
  iter++
  console.log(iter.toString())
  return iter.toString()
}

const run = async () => {
  if (await corelink.connect({ username, password }, config).catch((err) => { console.log(err) })) {
    sender = await corelink.createSender({
      workspace,
      protocol,
      type: datatype,
      metadata: { name: 'Random Data' },
    }).catch((err) => { console.log(err) })

    // Provide the sender update callback
    corelink.on('sender', (data) => {
      console.log('Sender update:', data)
      if (data.receiverID) {
        receiverActive = true
      } else {
        receiverActive = false
      }
    })

    setInterval(async () => {
      if (receiverActive && sender) {
        const dataToSend = Buffer.from(randomdata());
        for (let i = 0; i < 7; i++) {
          await corelink.send(sender, dataToSend);
          console.log('Data sent:', dataToSend.toString());
          
        }
      }
    }, 1000);
   
  }
}

run()
