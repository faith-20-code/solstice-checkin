const { Queue } = require("bullmq");

const connection = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
};

const printQueue = new Queue("print-jobs", {
  connection,
});

module.exports = {
  printQueue,
  connection,
};