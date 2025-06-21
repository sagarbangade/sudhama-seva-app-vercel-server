const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donor",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    collectionDate: {
      type: Date,
      required: true,
    },
    collectionTime: {
      type: String,
      required: true,
      match: [
        /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Please enter valid time in HH:mm format",
      ],
    },
    notes: {
      type: String,
      trim: true,
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
donationSchema.index({ donor: 1, collectionDate: 1 });
donationSchema.index({ collectionDate: 1 });
donationSchema.index({ collectedBy: 1 });

// Prevent future dates
donationSchema.pre("save", function (next) {
  if (this.collectionDate > new Date()) {
    return next(new Error("Collection date cannot be in the future"));
  }
  next();
});

const Donation = mongoose.model("Donation", donationSchema);

module.exports = Donation;
