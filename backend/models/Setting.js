const mongoose = require("mongoose");

// One single document holds editable website content + cancellation settings.
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, default: "site", unique: true },

    // Cancellation settings (admin editable, no invented policy)
    cancellationEnabled: { type: Boolean, default: true },
    cancellationDeadlineHours: { type: Number, default: 48 },
    refundPercentage: { type: Number, default: 100 },
    cancellationPolicyText: {
      type: String,
      default:
        "Placeholder policy: cancellation is allowed until the deadline set by the resort. The final policy will be updated by the resort.",
    },

    // Website content (simple editing, not a full CMS)
    aboutText: {
      type: String,
      default:
        "Shankari Riverfront Resort is a peaceful riverfront retreat designed for guests looking for comfort, relaxation and memorable celebrations.",
    },
    contactPhone: { type: String, default: "+91 89596 55405" },
    contactEmail: { type: String, default: "engparidhi29@gmail.com" },
    contactAddress: {
      type: String,
      default: "5G33+8J4, Balgaon, Akbarpura, Madhya Pradesh 451228",
    },
    galleryImages: {
      type: [String],
      default: [
        "gallery-01.jpg",
        "gallery-02.jpg",
        "gallery-03.jpg",
        "gallery-04.jpg",
        "gallery-05.jpg",
        "gallery-06.jpg",
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Setting", settingSchema);
