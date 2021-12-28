const { Worker } = require('worker_threads')
const path = require('path')

const lauchWorker = (id) => {
  const worker = new Worker(path.resolve(__dirname) + '/worker', { workerData: `${id}`, env: process.env })
  worker.on('message', async (message) => worker.terminate())
}

module.exports = lauchWorker