const express = require("express");
const pool = require("./db");
const { printQueue } = require("./queue");

const router = express.Router();


// HOME
router.get("/", (req, res) => {
  res.json({
    message: "Solstice Check-In Service",
  });
});


// CHECK-IN
router.post("/check-in", async (req, res) => {
  try {
    const { qrCode } = req.body;

    if (!qrCode) {
      return res.status(400).json({
        message: "QR code is required",
      });
    }

    const result = await pool.query(
      "SELECT * FROM attendees WHERE qr_code = $1",
      [qrCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Attendee not found",
      });
    }

    const attendee = result.rows[0];

    // Prevent duplicate scans
    if (attendee.checked_in) {
      return res.status(409).json({
        message: "Attendee already checked in",
      });
    }

    // Mark as pending while the print job is processing
    await pool.query(
      `UPDATE attendees
       SET print_status = 'PENDING'
       WHERE id = $1`,
      [attendee.id]
    );

    // Add print job to BullMQ
    const job = await printQueue.add("print-badge", {
      attendeeId: attendee.id,
      name: attendee.name,
      qrCode: attendee.qr_code,
    });

    res.status(202).json({
      message: "Check-in pending",
      attendee: attendee.name,
      jobId: job.id,
      status: "PENDING",
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
});


// PRINT COMPLETION WEBHOOK
router.post("/webhooks/print-complete", async (req, res) => {
  try {
    const secret = req.headers["x-webhook-secret"];

    if (secret !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({
        message: "Unauthorized webhook",
      });
    }

    const { attendeeId, printJobId } = req.body;

    if (!attendeeId || !printJobId) {
      return res.status(400).json({
        message: "attendeeId and printJobId are required",
      });
    }

    // Atomically mark the attendee as checked in.
    // AND checked_in = FALSE prevents duplicate/out-of-order confirmations.
    const updateResult = await pool.query(
      `UPDATE attendees
       SET checked_in = TRUE,
           print_status = 'PRINTED'
       WHERE id = $1
         AND checked_in = FALSE
       RETURNING *`,
      [attendeeId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(200).json({
        message: "Attendee already checked in",
      });
    }

    res.status(200).json({
      message: "Print confirmed and attendee checked in",
      printJobId,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
});


// CHECK-IN STATUS
router.get("/check-in/:qrCode", async (req, res) => {
  try {
    const { qrCode } = req.params;

    const result = await pool.query(
      "SELECT name, qr_code, checked_in, print_status FROM attendees WHERE qr_code = $1",
      [qrCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Attendee not found",
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
});


module.exports = router;