const Setting = require("../models/Setting");

// Loads the single settings document, creating it with defaults if missing
async function getSettings() {
  let setting = await Setting.findOne({ key: "site" });
  if (!setting) setting = await Setting.create({ key: "site" });
  return setting;
}

// GET /api/content  (public website content + cancellation policy)
async function getContent(req, res) {
  const s = await getSettings();
  res.json({
    aboutText: s.aboutText,
    contactPhone: s.contactPhone,
    contactEmail: s.contactEmail,
    contactAddress: s.contactAddress,
    galleryImages: s.galleryImages,
    cancellationEnabled: s.cancellationEnabled,
    cancellationDeadlineHours: s.cancellationDeadlineHours,
    refundPercentage: s.refundPercentage,
    cancellationPolicyText: s.cancellationPolicyText,
  });
}

module.exports = { getContent, getSettings };
