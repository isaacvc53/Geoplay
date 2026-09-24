// data/countries/india.js
// Checked against the real india.svg (same simplemaps.com family as
// france.svg/italy.svg, not amCharts). Its <path> elements use:
//   <path id="INKA" name="Karnataka" d="...">
// i.e. ids are "IN" + a state/UT-specific code (uppercase, NO hyphen),
// and the region name lives in a "name" attribute, not "title" like
// the amCharts-sourced SVGs.
//
// All 36 ids in india.svg were confirmed to map 1:1 to India's 28
// states + 8 union territories (current, post-Telangana/Ladakh split,
// i.e. Andhra Pradesh + Telangana are separate, and Jammu & Kashmir +
// Ladakh are separate). Note the SVG's own "name" values use older/
// alternate spellings in a few places (e.g. "Orissa" instead of
// "Odisha", "Uttaranchal" instead of "Uttarakhand", "Pondicherry"-era
// id "INPY" for Puducherry) — the ids below were taken verbatim from
// the SVG while `display`/`names` use the current official names for
// matching and display, with the SVG's own historical name kept as
// an alternate in `names` for robustness.
//
// NOTE: there is currently no seed_india.py (same as brazil.js/
// cuba.js/italy.js/france.js), so this page will work in local mode
// until you decide to seed Country="India" in the database.
//
// viewBox: india.svg declares lowercase viewbox="0 0 1000 1000",
// so — same caveat as italy.js/france.js — game.js's case-sensitive
// getAttribute("viewBox") won't pick it up automatically; it's set
// explicitly here.

window.GEOPLAY_COUNTRY = {
  slug: "india",
  lang: "en",
  kicker: "GeoPlay · India",
  title: "How many Indian states and union territories can you name?",
  subtitle: "Type a state or union territory and the map will fill in.",
  total: 36,
  quizSeconds: 20 * 60,
  geoFile: "../data/geo/india.svg",
  // india.svg declares its viewBox as lowercase `viewbox="0 0 1000 1000"`
  // (simplemaps.com convention, like france.svg/italy.svg). Must be set
  // explicitly here or the map falls back to the page's default viewBox
  // and renders cropped/misaligned with a miscalibrated zoom extent.
  viewBox: "0 0 1000 1000",

  guessPlaceholder: "Type a state or UT…",
  submitLabel: "Check",
  pauseLabel: "Pause",
  resumeLabel: "Resume",
  missingLabel: "My states",
  giveUpLabel: "Give up",
  resetLabel: "Reset",
  hintText: "Drag the map · scroll to zoom",
  hintTextRevealed: "Hover over a region to see its name",

  correctPrefix: "Correct! ",
  notFoundMessage: "Not found or ambiguous name.",
  alreadyFoundMessage: "That one has already been found.",
  noneFoundMessage: "You haven't guessed any yet.",
  pausedMessage: "The quiz is paused.",
  completeMessage: "You've completed all 36 states and union territories of India! 🇮🇳",
  timeUpMessage: "Time's up.",
  giveUpMessage: "Quiz finished: {count}/{total}. The missing states/UTs are highlighted; hover over them to see their names.",
  readyMessage: "Map ready — start typing!",
  readyLocalMessage: "Map ready in local mode.",
  loadErrorMessage: "Could not load the map of India. Check your connection.",

  regions: [
    { id: "INAN", display: "Andaman and Nicobar Islands", names: ["Andaman and Nicobar Islands", "Andaman and Nicobar", "Andaman & Nicobar"], region_id: null },
    { id: "INAP", display: "Andhra Pradesh", names: ["Andhra Pradesh"], region_id: null },
    { id: "INAR", display: "Arunachal Pradesh", names: ["Arunachal Pradesh"], region_id: null },
    { id: "INAS", display: "Assam", names: ["Assam"], region_id: null },
    { id: "INBR", display: "Bihar", names: ["Bihar"], region_id: null },
    { id: "INCH", display: "Chandigarh", names: ["Chandigarh"], region_id: null },
    { id: "INCT", display: "Chhattisgarh", names: ["Chhattisgarh", "Chattisgarh"], region_id: null },
    { id: "INDH", display: "Dadra and Nagar Haveli and Daman and Diu", names: ["Dadra and Nagar Haveli and Daman and Diu", "Dādra and Nagar Haveli and Damān and Diu", "Dadra and Nagar Haveli", "Daman and Diu"], region_id: null },
    { id: "INDL", display: "Delhi", names: ["Delhi", "National Capital Territory of Delhi", "NCT of Delhi"], region_id: null },
    { id: "INGA", display: "Goa", names: ["Goa"], region_id: null },
    { id: "INGJ", display: "Gujarat", names: ["Gujarat"], region_id: null },
    { id: "INHR", display: "Haryana", names: ["Haryana"], region_id: null },
    { id: "INHP", display: "Himachal Pradesh", names: ["Himachal Pradesh"], region_id: null },
    { id: "INJH", display: "Jharkhand", names: ["Jharkhand"], region_id: null },
    { id: "INJK", display: "Jammu and Kashmir", names: ["Jammu and Kashmir", "Jammu & Kashmir", "J&K"], region_id: null },
    { id: "INKA", display: "Karnataka", names: ["Karnataka"], region_id: null },
    { id: "INKL", display: "Kerala", names: ["Kerala"], region_id: null },
    { id: "INLA", display: "Ladakh", names: ["Ladakh"], region_id: null },
    { id: "INLD", display: "Lakshadweep", names: ["Lakshadweep"], region_id: null },
    { id: "INMP", display: "Madhya Pradesh", names: ["Madhya Pradesh"], region_id: null },
    { id: "INMH", display: "Maharashtra", names: ["Maharashtra"], region_id: null },
    { id: "INMN", display: "Manipur", names: ["Manipur"], region_id: null },
    { id: "INML", display: "Meghalaya", names: ["Meghalaya"], region_id: null },
    { id: "INMZ", display: "Mizoram", names: ["Mizoram"], region_id: null },
    { id: "INNL", display: "Nagaland", names: ["Nagaland"], region_id: null },
    { id: "INOR", display: "Odisha", names: ["Odisha", "Orissa"], region_id: null },
    { id: "INPY", display: "Puducherry", names: ["Puducherry", "Pondicherry"], region_id: null },
    { id: "INPB", display: "Punjab", names: ["Punjab"], region_id: null },
    { id: "INRJ", display: "Rajasthan", names: ["Rajasthan"], region_id: null },
    { id: "INSK", display: "Sikkim", names: ["Sikkim"], region_id: null },
    { id: "INTN", display: "Tamil Nadu", names: ["Tamil Nadu", "Tamilnadu"], region_id: null },
    { id: "INTG", display: "Telangana", names: ["Telangana"], region_id: null },
    { id: "INTR", display: "Tripura", names: ["Tripura"], region_id: null },
    { id: "INUP", display: "Uttar Pradesh", names: ["Uttar Pradesh"], region_id: null },
    { id: "INUT", display: "Uttarakhand", names: ["Uttarakhand", "Uttaranchal"], region_id: null },
    { id: "INWB", display: "West Bengal", names: ["West Bengal"], region_id: null },
  ],
};
