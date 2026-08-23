function printBadge(attendee) {
  return new Promise((resolve) => {
    console.log(`Sending badge to printer for ${attendee.name}...`);

    setTimeout(() => {
      console.log(`Badge printed successfully for ${attendee.name}`);

      resolve({
        success: true,
        printJobId: `PRINT-${Date.now()}`,
      });
    }, 3000);
  });
}

module.exports = {
  printBadge,
};