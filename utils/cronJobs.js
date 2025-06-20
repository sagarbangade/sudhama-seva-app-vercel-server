const cron = require('node-cron');
const Donor = require('../models/donor.model');
const Donation = require('../models/donation.model');

// Function to update donor status to pending when collection date is missed
async function updateDonorStatus() {
  try {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Find donors whose collection date has passed and they don't have a donation for current month
    const donors = await Donor.find({
      collectionDate: { 
        $lt: today, // Collection date has passed
        $ne: null 
      },
      isActive: true,
      status: { $ne: 'pending' }
    });

    let updatedCount = 0;

    for (const donor of donors) {
      // Check if donor has a donation for the current month
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

      const existingDonation = await Donation.findOne({
        donor: donor._id,
        collectionDate: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      });

      // If no donation exists for current month, set status to pending
      if (!existingDonation) {
        // Add to status history
        donor.statusHistory.push({
          status: 'pending',
          date: new Date(),
          notes: 'Automatically set to pending - collection date missed and no donation for current month'
        });
        
        donor.status = 'pending';
        await donor.save();
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} donors to pending status - collection date missed without current month donation`);
    return { updatedCount, totalChecked: donors.length };
  } catch (error) {
    console.error('Error updating donor status:', error);
    throw error;
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