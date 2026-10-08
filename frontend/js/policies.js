/* Fills the configurable values inside the policy pages.
   Edit the values in config/resort.js - never inside the HTML. */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-resort]").forEach((el) => {
    const value = RESORT_CONFIG[el.dataset.resort];
    if (value !== undefined && value !== "") el.textContent = value;
  });
});
