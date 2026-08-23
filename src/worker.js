require("dotenv").config();

const { Worker } = require("bullmq");
const { connection } = require("./queue");
const { printBadge } = require("./printer");

const worker = new Worker(
  "print-jobs",
  async (job) => {
    console.log(`Processing print job ${job.id}`);

    const result = await printBadge({
      name: job.data.name,
    });

    console.log(`Print job ${job.id} completed`);

    await fetch("http://localhost:3000/webhooks/print-complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": process.env.WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        attendeeId: job.data.attendeeId,
        printJobId: result.printJobId,
      }),
    });

    return result;
  },
  {
    connection,
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on("failed", (job, error) => {
  console.error(`Job ${job?.id} failed:`, error.message);
});

console.log("Print worker running...");