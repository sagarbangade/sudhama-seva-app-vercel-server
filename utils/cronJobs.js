const cron = require('node-cron');
const Donor = require('../models/donor.model');
const Donation = require('../models/donation.model');

// Function to initialize monthly donations
async function initializeMonthlyDonations() {
  try {
    console.log('Starting monthly donation initialization...');
    
    // Get current month in YYYY-MM format
    const date = new Date();
    const currentMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    // Get all active donors
    const donors = await Donor.find({ isActive: true });
    console.log(`Found ${donors.length} active donors`);
    
    let initialized = 0;
    let skipped = 0;
    
    // Initialize donations for each donor
    for (const donor of donors) {
      try {
        // Check if donation already exists for this month
        const existingDonation = await Donation.findOne({
          donor: donor._id,
          collectionMonth: currentMonth
        });
        
        if (!existingDonation) {
          await Donation.create({
            donor: donor._id,
            amount: 0, // Will be updated when collected
            collectionDate: new Date(),
            collectionMonth: currentMonth,
            status: 'pending',
            collectedBy: donor.createdBy, // Default to donor's creator
            notes: 'Automatically initialized for monthly collection'
          });
          initialized++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`Error processing donor ${donor._id}:`, error);
      }
    }
    
    console.log(`Monthly donations initialized for ${currentMonth}:`, {
      initialized,
      skipped,
      total: donors.length
    });
  } catch (error) {
    console.error('Error initializing monthly donations:', error);
  }
}

// Schedule the cron job to run at 00:01 on the first day of each month
const scheduleDonationInitialization = () => {
  // Run at 1 minute past midnight on the first day of every month
  cron.schedule('1 0 1 * *', () => {
    console.log('Running scheduled monthly donation initialization...');
    initializeMonthlyDonations();
  });
};

module.exports = {
  scheduleDonationInitialization,
  initializeMonthlyDonations // Export for manual triggering if needed
};