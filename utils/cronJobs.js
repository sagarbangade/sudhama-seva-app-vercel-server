const cron = require('node-cron');
const Donor = require('../models/donor.model');

// Function to update donor status to pending before next collection date
async function updateDonorStatus() {
  try {
    const date = new Date();
    date.setDate(date.getDate() + 7); // Get date 7 days from now

    // Find donors whose next collection date is within 7 days
    const donors = await Donor.find({
      collectionDate: { 
        $lte: date,
        $ne: null 
      },
      isActive: true,
      status: { $ne: 'pending' }
    });

    for (const donor of donors) {
      // Add to status history
      donor.statusHistory.push({
        status: 'pending',
        date: new Date(),
        notes: 'Automatically set to pending for next collection'
      });
      
      donor.status = 'pending';
      await donor.save();
    }

    console.log(`Updated ${donors.length} donors to pending status`);
  } catch (error) {
    console.error('Error updating donor status:', error);
  }
}

// Schedule the cron job to run daily at midnight
const scheduleStatusUpdates = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      await updateDonorStatus();
    } catch (error) {
      console.error('Cron job error:', error);
    }
  });
};

module.exports = {
  scheduleStatusUpdates,
  updateDonorStatus // Export for testing purposes
};