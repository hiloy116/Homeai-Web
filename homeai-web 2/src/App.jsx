import React, { useState, useRef, useEffect } from "react";
import { supabase, BACKEND_URL } from "./lib/supabaseClient.js";
import {
  Camera, Send, Home as HomeIcon, Clock, User, ChevronLeft, Plus,
  CheckCircle2, Star, MapPin, CreditCard, X,
  Flame, ChevronRight, PhoneCall, ImageOff, Play, ExternalLink,
  Snowflake, Bell, Wrench, CloudRain, Trash2, Droplets, Sprout, Building2,
  Bug, Wind, SprayCan, ChevronDown, BookOpen, Users, Receipt, Share2, ShieldCheck, Sun, MessageCircle, Search, HelpCircle, Mail,
} from "lucide-react";

/* ---------------------------------- THEME ---------------------------------- */
const C = {
  bg: "#FAF7F2",
  surface: "#FFFFFF",
  border: "#EAE1CF",
  ink: "#232F38",
  inkSoft: "#6B7580",
  inkFaint: "#A2AAB2",
  accent: "#B9793D",
  accentDark: "#8F5F2E",
  accentSoft: "#F3E3CC",
  sage: "#5F7A64",
  sageSoft: "#E4EAE1",
  amber: "#B4832E",
  amberSoft: "#F4E7CD",
  brick: "#A6472F",
  brickSoft: "#F3DED7",
  emergency: "#7E2A1C",
  emergencySoft: "#F0D3C9",
};
const FONT_DISPLAY = "'Fraunces', Georgia, serif";
const FONT_BODY = "'Inter', -apple-system, sans-serif";
const FONT_MONO = "'IBM Plex Mono', monospace";

const URGENCY_STYLES = {
  low: { label: "Low urgency", bg: C.sageSoft, fg: C.sage },
  medium: { label: "Medium urgency", bg: C.amberSoft, fg: C.amber },
  high: { label: "High urgency", bg: C.brickSoft, fg: C.brick },
  emergency: { label: "Emergency", bg: C.emergencySoft, fg: C.emergency },
};

const STAGES = ["Scheduled", "On the way", "In progress", "Completed"];
const V1_TIMELINE_LABEL = "Working on contract";
const STATUS_STYLES = {
  "Requested Quote": { bg: C.amberSoft, fg: C.amber },
  [V1_TIMELINE_LABEL]: { bg: C.accentSoft, fg: C.accentDark },
  Scheduled: { bg: C.amberSoft, fg: C.amber },
  "On the way": { bg: C.accentSoft, fg: C.accentDark },
  "In progress": { bg: C.sageSoft, fg: C.sage },
  Completed: { bg: C.sageSoft, fg: C.sage },
  "Handled myself": { bg: C.accentSoft, fg: C.accentDark },
  Active: { bg: C.sageSoft, fg: C.sage },
  Pending: { bg: C.amberSoft, fg: C.amber },
};

/* ---------------------------------- DATA ---------------------------------- */
const ISSUE_PRESETS = {
  water_stain: {
    id: "water_stain", title: "Ceiling water stain", trade: "Plumbing", urgency: "medium",
    cause: "Stains like this usually mean a slow leak somewhere above — a bathroom, roof flashing, or an AC line. The stain itself is old water damage, not necessarily an active leak, but it's worth confirming the source has stopped.",
    cost: [220, 650], diy: false,
    diyNote: "Not a great DIY fix — finding the actual source usually means opening the ceiling or checking the floor above.",
    emergency: false,
  },
  ac_noise: {
    id: "ac_noise", title: "AC making a rattling noise", trade: "HVAC", urgency: "low",
    cause: "A rattle like this is commonly a loose panel, debris in the outdoor unit, or a fan blade slightly out of balance. Rarely urgent.",
    cost: [95, 320], diy: true,
    diyNote: "Worth a quick look yourself — check for loose panels or debris around the outdoor unit before calling anyone.",
    emergency: false,
    diyGuide: {
      video: { title: "Fix a rattling AC unit yourself", channel: "HouseSmarts", query: "fix rattling noisy AC unit outdoor panel" },
      articleQuery: "why is my outdoor AC unit rattling how to fix",
      tools: ["Screwdriver", "Work gloves", "Flashlight"],
      supplies: ["None usually needed"],
      cost: [0, 20],
    },
  },
  outlet: {
    id: "outlet", title: "Outlet stopped working", trade: "Electrical", urgency: "low",
    cause: "Most dead outlets trace back to a tripped GFCI or breaker rather than a wiring fault. If a reset doesn't fix it, there may be a loose connection worth having checked.",
    cost: [0, 180], diy: true,
    diyNote: "Try resetting any nearby GFCI outlets and your breaker panel first — that solves this more often than not.",
    emergency: false,
    diyGuide: {
      video: { title: "Reset a dead outlet: GFCI & breaker basics", channel: "This Old House", query: "outlet not working reset GFCI breaker" },
      articleQuery: "outlet not working troubleshooting GFCI breaker",
      tools: ["Voltage tester (optional but safer)", "Flathead screwdriver"],
      supplies: ["Replacement GFCI outlet, if needed — ~$15"],
      cost: [0, 25],
    },
  },
  tile_crack: {
    id: "tile_crack", title: "Cracked floor tile", trade: "Flooring", urgency: "low",
    cause: "A single cracked tile is usually cosmetic — an impact, or the house settling slightly. Worth fixing before it spreads, but not urgent.",
    cost: [60, 240], diy: true,
    diyNote: "A single tile swap is a reasonable weekend project if you're comfortable with basic tools.",
    emergency: false,
    diyGuide: {
      video: { title: "How to replace one cracked floor tile", channel: "Family Handyman", query: "replace a single cracked floor tile diy" },
      articleQuery: "how to replace a single cracked floor tile step by step",
      tools: ["Grout saw or chisel", "Putty knife", "Rubber mallet", "Safety glasses"],
      supplies: ["Matching replacement tile", "Tile adhesive", "Grout"],
      cost: [15, 40],
    },
  },
  gas_smell: {
    id: "gas_smell", title: "Smell of gas near the stove", trade: "Emergency", urgency: "emergency",
    cause: "A gas smell is always treated as urgent — it can mean a loose fitting, an unlit pilot light, or a leak in the line.",
    cost: [0, 0], diy: false,
    diyNote: "Do not attempt to fix this yourself.",
    emergency: true,
  },
  generic: {
    id: "generic", title: "Home issue", trade: "Handyman", urgency: "medium",
    cause: "Based on what you've described, this looks like something a generalist could take a look at and diagnose further in person.",
    cost: [100, 400], diy: false,
    diyNote: "Hard to call without seeing it — a generalist can confirm quickly on site.",
    emergency: false,
  },
  driveway_wash: {
    id: "driveway_wash", title: "Driveway needs pressure washing", trade: "Pressure Washing", urgency: "low",
    cause: "Dark streaks and buildup on a driveway are usually algae, mildew, or oil residue — cosmetic, but worth clearing before it gets slippery or stains further.",
    cost: [150, 350], diy: true,
    diyNote: "Doable with a rented pressure washer, though a pro will get oil stains out more thoroughly and won't damage the concrete surface.",
    emergency: false,
    diyGuide: {
      video: { title: "How to pressure wash a concrete driveway", channel: "Family Handyman", query: "how to pressure wash a concrete driveway" },
      articleQuery: "how to pressure wash your own driveway safely",
      tools: ["Pressure washer (rented or owned)", "Stiff outdoor broom", "Safety glasses"],
      supplies: ["Concrete cleaner or degreaser"],
      cost: [40, 90],
    },
  },
  furniture_assembly: {
    id: "furniture_assembly", title: "Furniture needs assembly", trade: "Handyman", urgency: "low",
    cause: "Flat-pack furniture is usually straightforward with the included hardware, but bigger or multi-piece items — wardrobes, bed frames, sectional shelving — go a lot faster and end up sturdier with an extra set of hands.",
    cost: [80, 200], diy: true,
    diyNote: "Most flat-pack pieces are very doable yourself — a pro mainly saves you time on bigger jobs or multi-piece furniture.",
    emergency: false,
    diyGuide: {
      video: { title: "Flat-pack furniture assembly tips", channel: "HouseSmarts", query: "flat pack furniture assembly tips and tricks" },
      articleQuery: "tips for assembling flat pack furniture faster",
      tools: ["Phillips screwdriver", "Allen key (usually included)", "Rubber mallet"],
      supplies: ["None usually needed — hardware ships with the furniture"],
      cost: [0, 20],
    },
  },
};

const CHIP_TEXT = {
  water_stain: "There's a water stain on my ceiling",
  ac_noise: "My AC is making a rattling noise",
  outlet: "An outlet in my kitchen stopped working",
  gas_smell: "I smell gas near the stove",
  driveway_wash: "My driveway needs pressure washing",
  furniture_assembly: "I have furniture that needs to be assembled",
};

const MEDIA_CHECK_OPTIONS = [
  { key: "furniture_assembly", label: "Furniture that needs assembly" },
  { key: "water_stain", label: "Water stain or leak" },
  { key: "generic", label: "Something else" },
];

// Real businesses via Google Places (Vancouver core of the GVA — Nanaimo-to-UBC coverage
// would need location-biased searches per sub-area; this demo centers on Vancouver/UBC).
// price ($/$$) is an estimate for demo purposes; Google doesn't expose pricing tier.
const CONTRACTORS = {
  Plumbing: [
    { name: "Main Street Plumbing", address: "966 W 14th Ave, Vancouver", rating: 5.0, reviews: 182, phone: "+1 604-968-5123", price: "$$" },
    { name: "Miller Plumbing & Drainage", address: "765 Victoria Dr, Vancouver", rating: 5.0, reviews: 199, phone: "+1 604-837-2507", price: "$$" },
    { name: "Rapid Plumbers Of Vancouver", address: "1333 W Broadway, Vancouver", rating: 5.0, reviews: 106, phone: "+1 778-800-7207", price: "$" },
  ],
  HVAC: [
    { name: "Skyra Heating & Cooling", address: "1155 Pacific St, Vancouver", rating: 5.0, reviews: 69, phone: "+1 604-603-1800", price: "$$" },
    { name: "Western Pacific HVAC", address: "1990 Pandora St, Vancouver", rating: 4.9, reviews: 211, phone: "+1 604-245-9451", price: "$$" },
    { name: "AZ Air Conditioning and Heating", address: "922 Homer St, Vancouver", rating: 4.9, reviews: 30, phone: "+1 778-770-5721", price: "$" },
  ],
  Electrical: [
    { name: "Davis Electrical", address: "627 Moberly Rd, Vancouver", rating: 5.0, reviews: 213, phone: "+1 604-916-3903", price: "$$" },
    { name: "TDR Electric Inc.", address: "1273 Clark Dr, Vancouver", rating: 4.9, reviews: 319, phone: "+1 604-987-4837", price: "$$" },
    { name: "Wicks Electric", address: "1990 Pandora St, Vancouver", rating: 4.9, reviews: 267, phone: "+1 604-765-8439", price: "$" },
  ],
  Flooring: [
    { name: "Flooring Co.", address: "1432 W Hastings St, Vancouver", rating: 5.0, reviews: 92, phone: "+1 604-210-5744", price: "$$" },
    { name: "VC Floor", address: "1122 SW Marine Dr, Vancouver", rating: 5.0, reviews: 78, phone: "+1 236-995-9398", price: "$" },
  ],
  Handyman: [
    { name: "YVR Handyman", address: "997 Seymour St, Vancouver", rating: 5.0, reviews: 122, phone: "+1 778-368-1322", price: "$" },
  ],
  "Pressure Washing": [
    { name: "Fraser Valley Pressure Wash", address: "Point Grey, Vancouver, BC", rating: 4.9, reviews: 34, phone: "+1 604-555-0142", price: "$", source: "homeai" },
    { name: "SparkleDrive Exterior Cleaning", address: "Kitsilano, Vancouver, BC", rating: 4.7, reviews: 58, phone: "+1 604-555-0198", price: "$", source: "google" },
  ],
};

const SLOTS = ["Today, 4:00 PM", "Tomorrow, 9:00 AM", "Tomorrow, 1:00 PM", "Thu, 10:00 AM"];

const FREE_PROJECT_LIMIT = 2;
const TRIAL_MONTHS = 2;
const BILLING_CYCLES = [
  { id: "monthly", label: "Monthly", period: "/mo", note: "Billed monthly" },
  { id: "seasonal", label: "3 Months", period: "/season", note: "Billed every 3 months" },
  { id: "annual", label: "Annual", period: "/yr", note: "Billed yearly · best value" },
];
const SUBSCRIPTION_PLANS = {
  plus: {
    name: "HomeAi Plus",
    tagline: "Everything you need to manage your home",
    features: ["Unlimited project requests", "Compare quotes from multiple pros", "Full project & maintenance tracking", "Recurring nudges & seasonal checklist"],
    pricing: { monthly: 9.99, seasonal: 24.99, annual: 89.99 },
  },
  premium: {
    name: "HomeAi Premium",
    tagline: "Priority treatment when it matters most",
    features: ["Everything in Plus", "Priority bookings — jump the queue", "Priority contractor responses", "Emergency line access"],
    pricing: { monthly: 19.99, seasonal: 49.99, annual: 179.99 },
  },
};

function pickSlots() {
  const shuffled = [...SLOTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2);
}

const INITIAL_ASSETS = [
  { id: 1, category: "Roof", label: "Asphalt shingle roof", installed: "2019", warranty: "2034" },
  { id: 2, category: "HVAC", label: "Central AC & furnace", installed: "2021", warranty: "2026" },
  { id: 3, category: "Water Heater", label: "Gas water heater", installed: "2018", warranty: "2028" },
];
const INITIAL_PROPERTIES = [{ id: 1, nickname: "Point Grey Home", address: "Point Grey, Vancouver, BC" }];

const ASSET_CATEGORIES = ["Roof", "HVAC", "Water Heater", "Appliance", "Paint", "Other"];
const RELATION_OPTIONS = ["Spouse / Partner", "Adult Child", "Family Member", "Caregiver", "Other"];
const LANGUAGE_OPTIONS = ["English", "繁體中文", "简体中文", "Français", "Español", "ਪੰਜਾਬੀ", "Tagalog"];
const EMERGENCY_CONTACTS = [
  { label: "Gas emergency line", phone: "+1 800-555-0100" },
  { label: "Poison control", phone: "+1 800-555-0122" },
  { label: "Water utility (emergency)", phone: "+1 604-555-0135" },
  { label: "Electrical utility (outages)", phone: "+1 604-555-0148" },
  { label: "Non-emergency police", phone: "+1 604-555-0111" },
];
const TIP_OPTIONS = [0, 10, 15, 20];
const SCAN_GUESSES = [
  { category: "Appliance", label: "Kitchen refrigerator" },
  { category: "Appliance", label: "Washer / dryer" },
  { category: "Water Heater", label: "Water heater" },
  { category: "HVAC", label: "Furnace / AC unit" },
  { category: "Appliance", label: "Dishwasher" },
];

const HOME_SCORE = 82;
const SEASON_LIST = ["Spring", "Summer", "Fall", "Winter"];
const TIMELINE_OPTIONS = ["Early in the season", "Mid-season", "Late in the season", "Anytime this season"];

function currentSeason(d) {
  const m = (d || new Date()).getMonth();
  if (m >= 2 && m <= 4) return "Spring";
  if (m >= 5 && m <= 7) return "Summer";
  if (m >= 8 && m <= 10) return "Fall";
  return "Winter";
}

const SEASON_START_MONTH = { Spring: 2, Summer: 5, Fall: 8, Winter: 11 };
const TIMELINE_ORDER = { "Early in the season": 0, "Mid-season": 1, "Late in the season": 2 };

function seasonPositionIndex(season, d) {
  const m = (d || new Date()).getMonth();
  const start = SEASON_START_MONTH[season];
  const offset = (m - start + 12) % 12;
  return Math.min(offset, 2);
}

// Compares a checklist item's suggested timing against how far into the season we
// actually are: overdue items (their window has passed and they're not done) read as
// urgent, items not due yet read as calm, items due right now read as medium, and
// completed items always read as calm regardless of timing.
function taskUrgencyStyle(task, season) {
  if (task.done) return { bg: C.sageSoft, fg: C.sage };
  const idx = TIMELINE_ORDER[task.timeline];
  if (idx === undefined) return { bg: C.accentSoft, fg: C.accentDark };
  const pos = seasonPositionIndex(season);
  if (pos > idx) return { bg: C.brickSoft, fg: C.brick };
  if (pos === idx) return { bg: C.amberSoft, fg: C.amber };
  return { bg: C.sageSoft, fg: C.sage };
}

const INITIAL_SEASONAL_TASKS = [
  { id: "spring-1", season: "Spring", label: "Clean gutters after winter debris", timeline: "Early in the season", done: false },
  { id: "spring-2", season: "Spring", label: "Inspect roof & flashing", timeline: "Early in the season", done: false },
  { id: "spring-3", season: "Spring", label: "Replace HVAC filter", timeline: "Mid-season", done: false },
  { id: "spring-4", season: "Spring", label: "Prep garden beds & lawn", timeline: "Mid-season", done: false },
  { id: "spring-5", season: "Spring", label: "Check outdoor faucets & hoses", timeline: "Early in the season", done: false },
  { id: "spring-6", season: "Spring", label: "Test smoke & CO detectors", timeline: "Anytime this season", done: false },
  { id: "summer-1", season: "Summer", label: "Mow & water the lawn regularly", timeline: "Anytime this season", done: false },
  { id: "summer-2", season: "Summer", label: "Exterior pressure washing", timeline: "Mid-season", done: false },
  { id: "summer-3", season: "Summer", label: "Service the AC before peak heat", timeline: "Early in the season", done: false },
  { id: "summer-4", season: "Summer", label: "Clean the dryer vent", timeline: "Mid-season", done: false },
  { id: "summer-5", season: "Summer", label: "Inspect deck or patio", timeline: "Mid-season", done: false },
  { id: "summer-6", season: "Summer", label: "Check for pests around the home", timeline: "Anytime this season", done: false },
  { id: "fall-1", season: "Fall", label: "Clean gutters before fall rain", timeline: "Early in the season", done: false },
  { id: "fall-2", season: "Fall", label: "Drain & winterize outdoor faucets", timeline: "Late in the season", done: false },
  { id: "fall-3", season: "Fall", label: "Chimney sweep", timeline: "Mid-season", done: false },
  { id: "fall-4", season: "Fall", label: "Rake leaves & trim trees", timeline: "Mid-season", done: false },
  { id: "fall-5", season: "Fall", label: "Replace HVAC filter", timeline: "Early in the season", done: false },
  { id: "fall-6", season: "Fall", label: "Test smoke & CO detectors", timeline: "Anytime this season", done: false },
  { id: "winter-1", season: "Winter", label: "Plan for snow & ice removal", timeline: "Early in the season", done: false },
  { id: "winter-2", season: "Winter", label: "Protect pipes from freezing", timeline: "Early in the season", done: false },
  { id: "winter-3", season: "Winter", label: "Check the sump pump", timeline: "Mid-season", done: false },
  { id: "winter-4", season: "Winter", label: "Inspect fire extinguisher", timeline: "Anytime this season", done: false },
  { id: "winter-5", season: "Winter", label: "Reverse ceiling fans for winter", timeline: "Early in the season", done: false },
  { id: "winter-6", season: "Winter", label: "Check attic insulation", timeline: "Mid-season", done: false },
];
function freshSeasonalTasks(overrides) {
  if (overrides) return overrides.map((t) => ({ ...t }));
  return INITIAL_SEASONAL_TASKS.map((t) => ({ ...t }));
}

// Snapshot from a live Vancouver, BC forecast lookup — a real production build would
// call a weather API server-side and refresh this automatically; here it's a fixed
// snapshot so the advisory logic below can be demonstrated honestly.
const TODAY_FORECAST = {
  currentTemp: 76,
  currentCondition: "Sunny",
  weekHighTemp: 83,
  weekLowTemp: 57,
  nextRainDay: "Sunday",
  nextRainChance: 75,
  nextRainHigh: 62,
};

const WEATHER_ADVISORIES = {
  freeze: {
    icon: Snowflake,
    title: "Freeze warning",
    subtitle: "Tap for quick steps to protect your pipes",
    chatText: "Here's how to protect your pipes tonight: let faucets drip slightly, open cabinet doors under sinks so warm air reaches the pipes, and disconnect any hoses outside.",
    notifText: "Freeze warning \u2014 protect your pipes",
  },
  heat: {
    icon: Sun,
    title: `Heat climbing to ${TODAY_FORECAST.weekHighTemp}\u00b0F this week`,
    subtitle: "Tap for a few quick heat-prep tips",
    chatText: `It's headed up to around ${TODAY_FORECAST.weekHighTemp}\u00b0F later this week. Worth checking your AC filter now, closing blinds on the sunny side during the day, and keeping an eye on anyone in the house who's heat-sensitive.`,
    notifText: `Heat climbing to ${TODAY_FORECAST.weekHighTemp}\u00b0F \u2014 check your AC filter`,
  },
  heavy_rain: {
    icon: CloudRain,
    title: `Rain moving in ${TODAY_FORECAST.nextRainDay}`,
    subtitle: `${TODAY_FORECAST.nextRainChance}% chance \u2014 tap for a quick check`,
    chatText: `Rain's moving in ${TODAY_FORECAST.nextRainDay} \u2014 about a ${TODAY_FORECAST.nextRainChance}% chance, with the temperature dropping to around ${TODAY_FORECAST.nextRainHigh}\u00b0F. Good time to check that your gutters and downspouts are clear so water drains away from the foundation instead of pooling near it.`,
    notifText: `Rain moving in ${TODAY_FORECAST.nextRainDay} \u2014 check your gutters`,
  },
  clear: {
    icon: Sun,
    title: "Clear skies this week",
    subtitle: "Good week for outdoor maintenance",
    chatText: "No major weather to plan around this week \u2014 a good stretch for anything outdoors, like pressure washing the driveway or clearing the gutters before the next round of rain.",
    notifText: "Clear skies this week \u2014 good time for outdoor projects",
  },
};

function pickWeatherAdvisory(forecast) {
  if (forecast.weekLowTemp <= 34) return WEATHER_ADVISORIES.freeze;
  if (forecast.weekHighTemp >= 85) return WEATHER_ADVISORIES.heat;
  if (forecast.nextRainChance >= 60) return WEATHER_ADVISORIES.heavy_rain;
  return WEATHER_ADVISORIES.clear;
}

const CURRENT_WEATHER_ADVISORY = pickWeatherAdvisory(TODAY_FORECAST);

const NOTIF_ITEMS = [
  { id: "weather-warning", icon: CURRENT_WEATHER_ADVISORY.icon, text: CURRENT_WEATHER_ADVISORY.notifText, time: "2 hr ago" },
  { id: "rate-pro", icon: Star, text: "Rate your recent plumbing job", time: "3 days ago" },
];

const SEED_JOBS = [
  {
    id: 0,
    flowVersion: "v2",
    homeId: 1,
    homeNickname: "Point Grey Home",
    title: "Driveway pressure washing",
    trade: "Pressure Washing",
    status: "Completed",
    type: "job",
    contractor: "Fraser Valley Pressure Wash",
    slot: "May 14, 2026",
    estimate: 220,
    beforePhoto: "https://picsum.photos/seed/homeai-driveway-before/400/300",
    afterPhoto: "https://picsum.photos/seed/homeai-driveway-after/400/300",
    invoice: {
      number: "HAI-10432",
      date: "May 14, 2026",
      lineItems: [
        { label: "Driveway pressure washing (2-car, ~600 sq ft)", amount: 180 },
        { label: "Oil stain pre-treatment", amount: 40 },
      ],
      total: 220,
    },
  },
  {
    id: 1,
    homeId: 1,
    homeNickname: "Point Grey Home",
    title: "Gardening & lawn care",
    trade: "Handyman",
    status: "Active",
    type: "recurring",
    contractor: "YVR Handyman",
    frequency: "Weekly, Saturdays",
    visits: [
      { date: "Jul 19, 2026", beforePhoto: "https://picsum.photos/seed/homeai-garden-before2/400/300", afterPhoto: "https://picsum.photos/seed/homeai-garden-after2/400/300" },
      { date: "Jul 12, 2026", beforePhoto: "https://picsum.photos/seed/homeai-garden-before1/400/300", afterPhoto: "https://picsum.photos/seed/homeai-garden-after1/400/300" },
    ],
  },
  {
    id: 2,
    homeId: 1,
    homeNickname: "Point Grey Home",
    title: "Gutter cleaning",
    trade: "Handyman",
    status: "Pending",
    type: "recurring",
    contractor: "YVR Handyman",
    frequency: "Every 3 months, Saturdays",
    visits: [],
  },
];

const FREQ_OPTIONS = ["Weekly", "Every 2 weeks", "Monthly", "Every 2 months", "Every 3 months", "Seasonally"];
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const INITIAL_NUDGES = [
  { id: "gutters", label: "Gutter cleaning", icon: CloudRain, enabled: true, freq: "Every 3 months", day: "Sat", trade: "Handyman" },
  { id: "bins", label: "Garbage bin wash", icon: Trash2, enabled: true, freq: "Monthly", day: "Mon", trade: "Handyman" },
  { id: "windows", label: "Window washing", icon: Droplets, enabled: false, freq: "Every 2 months", day: "Sun", trade: "Handyman" },
  { id: "garden", label: "Gardening & lawn care", icon: Sprout, enabled: true, freq: "Weekly", day: "Sat", trade: "Handyman" },
  { id: "pressure_wash", label: "Exterior pressure washing", icon: SprayCan, enabled: false, freq: "Every 6 months", day: "Sun", trade: "Pressure Washing" },
  { id: "dryer_vent", label: "Dryer vent cleaning", icon: Wind, enabled: false, freq: "Every 6 months", day: "Wed", trade: "Handyman" },
  { id: "pest_control", label: "Pest control", icon: Bug, enabled: false, freq: "Every 3 months", day: "Tue", trade: "Handyman" },
  { id: "chimney", label: "Chimney sweep", icon: Flame, enabled: false, freq: "Seasonally", day: "Sat", trade: "Handyman" },
];
function freshNudges() {
  return INITIAL_NUDGES.map((n) => ({ ...n }));
}

const NOTIF_PREF_LABELS = {
  jobUpdates: "Job status updates",
  newQuotes: "New quotes received",
  maintenanceReminders: "Maintenance reminders",
};

const FAQ_ENTRIES = [
  { keywords: ["quote", "request", "contractor", "pro", "find"], q: "How do I request a quote?", a: "On Home, describe or photograph your issue, then tap \"Find a pro for this.\" Pick as many contractors as you'd like and tap Request." },
  { keywords: ["free", "limit", "paywall", "subscription", "trial", "plan", "premium", "pay"], q: "How does the free plan and trial work?", a: "Your first 2 projects are free. After that, any plan starts with a 2-month free trial before billing begins. Manage it anytime from the plan banner in Profile." },
  { keywords: ["diy", "myself", "video", "tools", "supplies"], q: "What does \"I'll handle it myself\" show me?", a: "For DIY-safe issues, you'll get a materials cost estimate, a tools/supplies list, a video, and an article — everything you need to try it yourself before calling a pro." },
  { keywords: ["nudge", "reminder", "recurring", "schedule", "gutter"], q: "How do I change how often a nudge reminds me?", a: "Open Profile → Recurring nudges, tap the nudge, and pick a new frequency and day. You can also add your own custom nudges or remove ones you don't want." },
  { keywords: ["checklist", "seasonal", "season"], q: "How does the seasonal checklist work?", a: "It auto-shows chores relevant to the current season and colors items based on how close you are to the suggested timing. Tap an item's schedule pill to adjust it, or the checkbox to mark it done." },
  { keywords: ["warranty", "receipt", "item", "asset", "scan", "fridge", "appliance"], q: "How do I add an item and its warranty?", a: "Open Profile → Your home and tap \"Scan an item\" to photograph it, or \"Add manually.\" You can attach a receipt photo any time by tapping the item." },
  { keywords: ["property", "home", "second", "add", "another"], q: "Can I add more than one property?", a: "Yes — open Profile → Properties and tap Add property. Each one gets its own assets, checklist, and nudges." },
  { keywords: ["household", "family", "share", "caregiver"], q: "Can family members use this too?", a: "Open Profile → Household to add a spouse, adult child, or caregiver so they have visibility into this home." },
  { keywords: ["past", "again", "rebook", "same", "contractor"], q: "Can I rebook a contractor I've used before?", a: "Yes — Profile → Past contractors shows everyone you've worked with, their price history, and a one-tap \"Request again.\"" },
  { keywords: ["passport", "sell", "move", "realtor", "buyer"], q: "What is the Home Passport?", a: "It's a full maintenance history — projects, systems, warranties — assembled automatically, ready to share with a realtor or buyer when you sell." },
  { keywords: ["insurance", "claim"], q: "How do I get documentation for an insurance claim?", a: "Open a completed project in Projects and tap \"Export for insurance claim\" — it bundles the before/after photos, invoice, and dates." },
  { keywords: ["emergency", "gas", "urgent", "danger"], q: "What should I do in a home emergency?", a: "Tap the red phone icon on Home for emergency contacts. For a gas smell specifically, leave the house first and call from outside." },
  { keywords: ["cancel", "refund", "problem", "wrong", "dispute", "complaint"], q: "What if something goes wrong with a job?", a: "Open the completed project and tap \"Report an issue.\" A real person reviews every report, not an automated queue." },
  { keywords: ["text", "size", "font", "accessibility", "large"], q: "Can I make the text bigger?", a: "Yes — Profile → Settings → Text size has Normal, Large, and Extra large options." },
];

function matchFaq(text) {
  const t = text.toLowerCase();
  let best = null;
  let bestScore = 0;
  FAQ_ENTRIES.forEach((entry) => {
    const score = entry.keywords.filter((k) => t.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  });
  return best;
}

const HELP_TOPICS = [
  { target: "home", tab: "home", title: "Diagnose a home issue", desc: "Home → tap the camera, or type what's going on.", keywords: ["issue", "diagnose", "photo", "problem", "diagnosis"] },
  { target: "home", tab: "home", title: "Request a quote", desc: "Home → describe your issue → \"Find a pro for this.\"", keywords: ["quote", "contractor", "pro", "request", "hire"] },
  { target: "emergency", tab: "home", title: "Emergency contacts", desc: "Home → red phone icon at the top.", keywords: ["emergency", "gas", "urgent", "danger"] },
  { target: "homeNotifs", tab: "home", title: "Notifications", desc: "Home → bell icon to check off or dismiss alerts.", keywords: ["notification", "alert", "bell"] },
  { target: "current", tab: "projects", title: "Current projects", desc: "Projects → Current, for anything in progress.", keywords: ["current", "progress", "status", "project"] },
  { target: "past", tab: "projects", title: "Past projects & receipts", desc: "Projects → Past, for completed work and invoices.", keywords: ["past", "history", "completed", "receipt", "invoice"] },
  { target: "potential", tab: "projects", title: "Suggested projects", desc: "Projects → Potential, based on your recurring nudges.", keywords: ["potential", "suggested", "nudge"] },
  { target: "recurring", tab: "projects", title: "Recurring services", desc: "Projects → Recurring, for ongoing contracts like gardening.", keywords: ["recurring", "ongoing", "maintenance", "contract", "gardening"] },
  { target: "yourPlan", tab: null, title: "Manage your plan", desc: "Opens your plan directly.", keywords: ["plan", "subscription", "upgrade", "premium", "trial", "billing"] },
  { target: "seasonal", tab: "profile", title: "Seasonal checklist", desc: "Profile → this season's checklist.", keywords: ["checklist", "seasonal", "season"] },
  { target: "nudges", tab: "profile", title: "Recurring nudges", desc: "Profile → Recurring nudges, to add, edit, or remove.", keywords: ["nudge", "reminder", "recurring", "gutter"] },
  { target: "contractors", tab: "profile", title: "Past contractors", desc: "Profile → Past contractors, to call or rebook.", keywords: ["contractor", "rebook", "again", "call"] },
  { target: "yourHome", tab: "profile", title: "Your home items", desc: "Profile → Your home, to scan or add items & warranties.", keywords: ["item", "asset", "warranty", "scan", "appliance"] },
  { target: "properties", tab: "profile", title: "Properties", desc: "Profile → Properties, to add another home.", keywords: ["property", "home", "address", "second"] },
  { target: "household", tab: null, title: "Household sharing", desc: "Opens Your profile → Household directly.", keywords: ["household", "family", "share", "caregiver"] },
  { target: "photos", tab: "profile", title: "Photo timeline", desc: "Profile → Photo timeline, every photo in one place.", keywords: ["photo", "timeline", "picture"] },
  { target: "passport", tab: null, title: "Home Passport", desc: "Opens Home Passport directly.", keywords: ["passport", "sell", "move", "realtor"] },
  { target: "referral", tab: "profile", title: "Referrals", desc: "Profile → Settings → Invite a neighbor.", keywords: ["referral", "invite", "neighbor", "credit"] },
  { target: "textsize", tab: "profile", title: "Text size", desc: "Profile → Settings → Text size.", keywords: ["text", "size", "font", "accessibility"] },
  { target: "language", tab: "profile", title: "Language", desc: "Profile → Settings → Language.", keywords: ["language", "translate"] },
  { target: "receipts", tab: "profile", title: "Receipts", desc: "Profile → Settings → Receipts.", keywords: ["receipt", "invoice"] },
  { target: "payment", tab: "profile", title: "Payment methods", desc: "Profile → Settings → Payment methods.", keywords: ["payment", "card", "billing"] },
  { target: "pushnotifs", tab: "profile", title: "Notification preferences", desc: "Profile → Settings → Notifications.", keywords: ["notification", "preference", "push"] },
  { target: "support", tab: "profile", title: "Support & FAQ", desc: "Profile → Settings → Support, to chat with our help bot.", keywords: ["support", "help", "contact", "faq"] },
  { target: "yourProfile", tab: null, title: "Edit your info", desc: "Opens Your profile — name, phone, email, address.", keywords: ["name", "phone", "email", "address", "edit", "profile"] },
];

const PROFILE_SETTINGS_TARGETS = ["textsize", "language", "receipts", "payment", "pushnotifs", "support", "referral"];

function deriveGenericTitle(text) {
  let cleaned = (text || "").trim();
  cleaned = cleaned.replace(/^(i\s+(have|need|want|think i have)|there'?s|there is|my)\s+/i, "");
  cleaned = cleaned.replace(/[.?!]+$/, "");
  if (!cleaned) return "Home issue";
  const title = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return title.length > 55 ? title.slice(0, 52) + "…" : title;
}

function matchIssue(text) {
  const t = text.toLowerCase();
  if (t.includes("gas")) return ISSUE_PRESETS.gas_smell;
  if (t.includes("water") || t.includes("leak") || t.includes("stain") || t.includes("ceiling")) return ISSUE_PRESETS.water_stain;
  if (t.includes("ac") || t.includes("hvac") || t.includes("noise") || t.includes("rattl") || t.includes("furnace")) return ISSUE_PRESETS.ac_noise;
  if (t.includes("outlet") || t.includes("power") || t.includes("electric")) return ISSUE_PRESETS.outlet;
  if (t.includes("tile") || t.includes("floor") || t.includes("crack")) return ISSUE_PRESETS.tile_crack;
  if (t.includes("driveway") || t.includes("pressure wash") || t.includes("power wash")) return ISSUE_PRESETS.driveway_wash;
  if (t.includes("furniture") || t.includes("assemble") || t.includes("assembly") || t.includes("build") && t.includes("shelf")) return ISSUE_PRESETS.furniture_assembly;
  return ISSUE_PRESETS.generic;
}

function currentCostFor(trade) {
  const found = Object.values(ISSUE_PRESETS).find((p) => p.trade === trade);
  return found ? found.cost : [100, 300];
}

function estimateForTier(costRange, tier) {
  const [min, max] = costRange;
  if (max === 0) return 0;
  const factor = tier === "$" ? 0.32 : 0.58;
  return Math.round((min + (max - min) * factor) / 5) * 5;
}

function findContractorRecord(trade, name) {
  const list = CONTRACTORS[trade] || [];
  return list.find((c) => c.name === name) || null;
}

function fairPriceInfo(estimate, costRange) {
  if (!costRange || costRange[1] === 0) return null;
  const [min, max] = costRange;
  const mid = (min + max) / 2;
  if (estimate <= mid * 0.85) return { label: "Great price", color: C.sage, bg: C.sageSoft };
  if (estimate <= mid * 1.1) return { label: "Fair price", color: C.amber, bg: C.amberSoft };
  return { label: "Above average", color: C.brick, bg: C.brickSoft };
}

/* ---------------------------------- SMALL UI ---------------------------------- */
function UrgencyBadge({ level }) {
  const s = URGENCY_STYLES[level] || URGENCY_STYLES.medium;
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full" style={{ background: s.bg, color: s.fg, fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 0.4, fontWeight: 500, textTransform: "uppercase" }}>
      {level === "emergency" && <Flame size={12} />}
      {s.label}
    </span>
  );
}

function FairPriceBadge({ estimate, costRange }) {
  const info = fairPriceInfo(estimate, costRange);
  if (!info) return null;
  return (
    <span className="px-2 py-0.5 rounded-full" style={{ background: info.bg, color: info.color, fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.3 }}>
      {info.label}
    </span>
  );
}

function ReputationLine({ c }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap" style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkSoft }}>
      <span className="inline-flex items-center gap-0.5"><Star size={11} fill={C.accent} color={C.accent} /> {c.rating}</span>
      <span>· {c.reviews} {c.source === "homeai" ? "reviews" : "Google reviews"}</span>
      {c.source === "homeai" && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full" style={{ background: C.sageSoft, color: C.sage, fontFamily: FONT_MONO, fontSize: 9, fontWeight: 600 }}>
          <CheckCircle2 size={9} /> On HomeAi
        </span>
      )}
    </div>
  );
}

function VideoSuggestion({ video }) {
  const href = `https://www.youtube.com/results?search_query=${encodeURIComponent(video.query)}`;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl p-3 no-underline" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-center flex-shrink-0" style={{ width: 34, height: 34, borderRadius: 999, background: C.ink }}>
        <Play size={13} fill="#fff" color="#fff" />
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12.5, color: C.ink, lineHeight: 1.3 }}>{video.title}</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint, marginTop: 2 }}>{video.channel} · YouTube</div>
      </div>
      <ExternalLink size={13} color={C.inkFaint} />
    </a>
  );
}

function ArticleSuggestion({ query }) {
  const href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl p-3 no-underline" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-center flex-shrink-0" style={{ width: 34, height: 34, borderRadius: 999, background: C.accentSoft }}>
        <BookOpen size={15} color={C.accentDark} />
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12.5, color: C.ink, lineHeight: 1.3 }}>Read a step-by-step guide</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint, marginTop: 2 }}>Search the web</div>
      </div>
      <ExternalLink size={13} color={C.inkFaint} />
    </a>
  );
}

function DiyGuideBox({ guide }) {
  const [min, max] = guide.cost;
  return (
    <div className="rounded-2xl p-3" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.4 }}>DIY cost estimate</span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.sage, fontWeight: 700 }}>{max === 0 ? "Free" : `$${min}–$${max}`}</span>
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 }}>Tools you'll need</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.ink, marginBottom: 8, lineHeight: 1.4 }}>{guide.tools.join(", ")}</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 }}>Supplies</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.ink, lineHeight: 1.4 }}>{guide.supplies.join(", ")}</div>
    </div>
  );
}

function ToggleSwitch({ on, onClick }) {
  return (
    <button onClick={onClick} className="relative flex-shrink-0" style={{ width: 34, height: 20, borderRadius: 999, background: on ? C.accent : C.border, transition: "background 0.15s" }}>
      <span className="absolute" style={{ top: 2, left: on ? 16 : 2, width: 16, height: 16, borderRadius: 999, background: "#fff", transition: "left 0.15s" }} />
    </button>
  );
}

function SectionHeader({ title, subtitle, meta, open, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-3.5 rounded-2xl"
      style={{ background: open ? C.accentSoft : C.surface, border: `1.5px solid ${open ? C.accent : C.border}` }}
    >
      <div className="text-left flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 14.5, color: C.ink }}>{title}</span>
          {meta && (
            <span className="px-1.5 py-0.5 rounded-full" style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: C.accentDark, background: "#fff", fontWeight: 700 }}>{meta}</span>
          )}
        </div>
        {subtitle && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.inkSoft, marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div className="flex items-center justify-center flex-shrink-0 ml-2" style={{ width: 30, height: 30, borderRadius: 999, background: C.accent }}>
        <ChevronDown size={17} color="#fff" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </div>
    </button>
  );
}

function PrimaryButton({ children, onClick, disabled, style }) {
  return (
    <button onClick={onClick} disabled={disabled} className="w-full py-3 rounded-2xl transition-opacity" style={{ background: disabled ? C.inkFaint : C.ink, color: "#fff", fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14, opacity: disabled ? 0.6 : 1, ...style }}>
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, style }) {
  return (
    <button onClick={onClick} className="w-full py-3 rounded-2xl" style={{ background: "transparent", color: C.inkSoft, border: `1px solid ${C.border}`, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14, ...style }}>
      {children}
    </button>
  );
}

/* ---------------------------------- CHAT CARDS ---------------------------------- */
function TypingBubble() {
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}`, width: "fit-content" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ width: 6, height: 6, borderRadius: 999, background: C.accent, animation: `homeaiBounce 1s ${i * 0.15}s infinite ease-in-out` }} />
      ))}
    </div>
  );
}

function FollowUpCard({ onNewProject, onKeepAsking }) {
  return (
    <div className="rounded-3xl p-4" style={{ background: C.surface, border: `1px solid ${C.border}`, maxWidth: 280 }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.ink, fontWeight: 600, marginBottom: 10 }}>
        Would you like to start a new project, or do you have more questions about this one?
      </div>
      <div className="flex flex-col gap-1.5">
        <button onClick={onNewProject} className="w-full text-left px-3 py-2.5 rounded-xl" style={{ background: C.ink, color: "#fff", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600 }}>
          Start a new project
        </button>
        <button onClick={onKeepAsking} className="w-full text-left px-3 py-2.5 rounded-xl" style={{ border: `1px solid ${C.border}`, color: C.ink, fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600 }}>
          I have more questions about this
        </button>
      </div>
    </div>
  );
}

function MediaCheckCard({ msg, onSelect }) {
  return (
    <div className="rounded-3xl p-4" style={{ background: C.surface, border: `1px solid ${C.border}`, maxWidth: 280 }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.ink, fontWeight: 600, marginBottom: 10 }}>Got it — what's this about?</div>
      <div className="flex flex-col gap-1.5">
        {MEDIA_CHECK_OPTIONS.map((opt) => (
          <button key={opt.key} onClick={() => onSelect(msg, opt.key)} className="w-full text-left px-3 py-2.5 rounded-xl" style={{ border: `1px solid ${C.border}`, fontFamily: FONT_BODY, fontSize: 12.5, color: C.ink }}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function DiagnosisCard({ msg, onDiy, onFindPro, onBookAgain }) {
  const d = msg.data;
  const [min, max] = d.cost;
  return (
    <div className="rounded-3xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}`, maxWidth: 320 }}>
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between mb-2">
          <UrgencyBadge level={d.urgency} />
          {d.emergency && <Flame size={16} color={C.emergency} />}
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 19, color: C.ink, lineHeight: 1.25 }}>{d.title}</div>
        {msg.fromPhoto && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.inkFaint, marginTop: 4 }}>From your {msg.mediaKind === "video" ? "video" : "photo"}</div>}
      </div>

      <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>What's likely going on</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: C.ink, lineHeight: 1.5 }}>{d.cause}</div>
      </div>

      {!d.emergency && (
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Cost to fix</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 16, color: C.ink, fontWeight: 500 }}>{max === 0 ? "$0" : `$${min}–$${max}`}</div>
          </div>
          <div className="text-right" style={{ maxWidth: 150 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{d.diy ? "Safe to DIY" : "Recommend a pro"}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.inkSoft, lineHeight: 1.4 }}>{d.diyNote}</div>
          </div>
        </div>
      )}

      <div className="p-4 space-y-2">
        {d.emergency ? (
          <PrimaryButton onClick={() => onFindPro(msg)} style={{ background: C.emergency }}>
            <span className="flex items-center justify-center gap-2"><PhoneCall size={14} /> Get emergency help now</span>
          </PrimaryButton>
        ) : msg.handled ? (
          <div className="flex items-center gap-2 justify-center py-2" style={{ color: C.sage, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600 }}>
            <CheckCircle2 size={16} /> {msg.handled === "diy" ? "Marked as handled" : "Finding you a pro…"}
          </div>
        ) : (
          <>
            {msg.repeatJob && (
              <div className="rounded-2xl p-3" style={{ background: C.accentSoft, border: `1px solid ${C.accent}55` }}>
                <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12.5, color: C.accentDark }}>You've used {msg.repeatJob.contractor} before</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.accentDark, opacity: 0.85, marginTop: 2 }}>{msg.repeatJob.title} · {msg.repeatJob.slot}</div>
                <button onClick={() => onBookAgain(msg)} className="w-full mt-2 py-2 rounded-xl" style={{ background: C.ink, color: "#fff", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600 }}>
                  Book {msg.repeatJob.contractor} again
                </button>
              </div>
            )}
            {d.diy && d.diyGuide && (
              <div className="space-y-2">
                <DiyGuideBox guide={d.diyGuide} />
                <VideoSuggestion video={d.diyGuide.video} />
                <ArticleSuggestion query={d.diyGuide.articleQuery} />
              </div>
            )}
            <PrimaryButton onClick={() => onFindPro(msg)}>{msg.repeatJob ? "Find a different pro" : "Find a pro for this"}</PrimaryButton>
            {d.diy && <GhostButton onClick={() => onDiy(msg)}>I'll handle it myself</GhostButton>}
          </>
        )}
      </div>
    </div>
  );
}

function ContractorsCard({ msg, onToggleSelect, onRequestQuotes, onBook, leadsByContractor }) {
  const list = CONTRACTORS[msg.trade] || CONTRACTORS.Handyman;

  if (msg.phase === "v1sent") {
    return (
      <div className="rounded-3xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}`, maxWidth: 300 }}>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2" style={{ color: C.sage }}>
            <CheckCircle2 size={16} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700 }}>Request sent</span>
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.ink, lineHeight: 1.5 }}>
            We've sent your request to {msg.selectedNames.join(", ")}. They'll reach out to you directly by phone or email over the next few days.
          </div>
          <div className="flex items-start gap-1.5 mt-2" style={{ color: C.sage }}>
            <ShieldCheck size={12} style={{ marginTop: 1, flexShrink: 0 }} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 11, lineHeight: 1.4 }}>Only the pros you picked will contact you — no spam calls from anyone else.</span>
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: C.inkFaint, marginTop: 8, lineHeight: 1.4 }}>
            We'll check back in with you soon — just helps us keep good records on your home for next time.
          </div>
        </div>
      </div>
    );
  }

  if (msg.phase === "gathering") {
    return (
      <div className="rounded-3xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}`, maxWidth: 300 }}>
        <div className="px-4 py-4 flex items-start gap-3">
          <div className="flex items-center gap-1.5 mt-1">
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ width: 5, height: 5, borderRadius: 999, background: C.accent, animation: `homeaiBounce 1s ${i * 0.15}s infinite ease-in-out` }} />
            ))}
          </div>
          <div>
            <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12.5, color: C.ink }}>Reaching out to {msg.selectedNames.length} pro{msg.selectedNames.length !== 1 ? "s" : ""} on your behalf</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, marginTop: 3, lineHeight: 1.4 }}>
              {msg.isPremium
                ? "As a Premium member, your request goes out flagged priority — pros are nudged to respond first."
                : "They're not on HomeAi yet, so our team is contacting them directly with your job details and photo. In the live app this can take a few hours — sped up here for the demo."}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (msg.phase === "compare") {
    return (
      <div className="rounded-3xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}`, maxWidth: 320 }}>
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-1.5">
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: C.ink }}>{msg.quotes.length} quotes are back</div>
            {msg.isPremium && (
              <span className="px-1.5 py-0.5 rounded-full" style={{ background: C.accent, color: "#fff", fontFamily: FONT_MONO, fontSize: 8.5, fontWeight: 700 }}>PRIORITY</span>
            )}
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, marginTop: 2 }}>Price and their next available dates, all at once</div>
          {msg.photoUrl && <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, marginTop: 1 }}>Your before photo was shared with each pro</div>}
          <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.amber, marginTop: 4, fontWeight: 600 }}>These quotes are valid for 48 hours</div>
        </div>
        <div className="px-4 pb-4 space-y-2">
          {msg.quotes.map((q) => {
            const isBooked = msg.bookedWith === q.name;
            const disabled = !!msg.bookedWith;
            return (
              <div key={q.name} className="rounded-2xl p-3" style={{ border: `1px solid ${isBooked ? C.accent : C.border}`, background: isBooked ? C.accentSoft : C.bg }}>
                <div className="flex items-center justify-between">
                  <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13.5, color: C.ink }}>{q.name}</div>
                  <div className="flex items-center gap-1.5">
                    <FairPriceBadge estimate={q.estimate} costRange={msg.costRange} />
                    <span style={{ fontFamily: FONT_MONO, fontSize: 14, color: C.ink, fontWeight: 500 }}>{q.estimate === 0 ? "Free" : `$${q.estimate}`}</span>
                  </div>
                </div>
                <div className="mt-1"><ReputationLine c={q} /></div>

                {isBooked ? (
                  <div className="flex items-center gap-1.5 mt-2 py-1.5 justify-center" style={{ color: C.sage, fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600 }}>
                    <CheckCircle2 size={13} /> Booked for {msg.chosenSlots?.[q.name]}
                  </div>
                ) : (
                  <div className="mt-2">
                    <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>Next available</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(q.availableSlots || SLOTS.slice(0, 2)).map((slot) => (
                        <button
                          key={slot}
                          onClick={() => onBook(msg, q, slot)}
                          disabled={disabled}
                          className="py-1.5 rounded-lg"
                          style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, background: disabled ? "transparent" : C.ink, color: disabled ? C.inkFaint : "#fff", border: disabled ? `1px solid ${C.border}` : "none" }}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const selectedCount = Object.values(msg.selected || {}).filter(Boolean).length;
  const hasHomeaiPro = list.some((c) => c.source === "homeai");
  return (
    <div className="rounded-3xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}`, maxWidth: 320 }}>
      <div className="px-4 pt-4 pb-1">
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: C.ink }}>A few {msg.trade.toLowerCase()} pros near you</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: C.inkFaint, marginTop: 2, lineHeight: 1.4 }}>
          {hasHomeaiPro
            ? "One pro below is already on HomeAi — the rest we found via Google and our team will reach out on your behalf. Select as many as you'd like."
            : "Found via Google — they're not on HomeAi yet, so our team reaches out on your behalf. Select as many as you'd like."}
        </div>
        {msg.propertyLabel && (
          <div className="flex items-center gap-1 mt-1.5" style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.accentDark }}>
            <MapPin size={10} /> Job at {msg.propertyLabel}
          </div>
        )}
      </div>
      <div className="px-4 pt-3 pb-3 space-y-2">
        {list.map((c) => {
          const checked = !!msg.selected?.[c.name];
          return (
            <button key={c.name} onClick={() => onToggleSelect(msg, c.name)} className="w-full text-left rounded-2xl p-3 flex items-start gap-3" style={{ border: `1px solid ${checked ? C.accent : C.border}`, background: checked ? C.accentSoft : C.bg }}>
              <div className="flex items-center justify-center mt-0.5" style={{ width: 18, height: 18, borderRadius: 6, border: `1.5px solid ${checked ? C.accent : C.inkFaint}`, background: checked ? C.accent : "transparent", flexShrink: 0 }}>
                {checked && <CheckCircle2 size={13} color="#fff" />}
              </div>
              <div className="flex-1 min-w-0">
                <span style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13.5, color: C.ink }}>{c.name}</span>
                <div className="mt-1"><ReputationLine c={c} /></div>
                {leadsByContractor?.[c.name] > 0 && (
                  <div className="flex items-center gap-1 mt-1" style={{ color: C.sage }}>
                    <Users size={10} />
                    <span style={{ fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 600 }}>
                      Requested by {leadsByContractor[c.name]} homeowner{leadsByContractor[c.name] !== 1 ? "s" : ""} on HomeAi
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1 mt-1" style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint }}>
                  <MapPin size={10} /> {c.address}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="px-4 pb-3">
        <PrimaryButton disabled={selectedCount === 0} onClick={() => onRequestQuotes(msg)}>
          {selectedCount === 0 ? "Select at least one pro" : `Request quotes from ${selectedCount} pro${selectedCount !== 1 ? "s" : ""}`}
        </PrimaryButton>
      </div>
      <div className="pb-3 text-center" style={{ fontFamily: FONT_BODY, fontSize: 9.5, color: C.inkFaint }}>Ratings & contact info via Google, unless marked "On HomeAi"</div>
    </div>
  );
}

function BookingCard({ msg, onChoose }) {
  return (
    <div className="rounded-3xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}`, maxWidth: 320 }}>
      <div className="px-4 pt-4 pb-2">
        {msg.repeatBooking && (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full mb-1.5" style={{ background: C.sageSoft, color: C.sage, fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: 600 }}>
            <CheckCircle2 size={9} /> Booking again
          </div>
        )}
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.inkSoft }}>{msg.contractor.name} can help</div>
        <div className="flex items-center gap-2 mt-1">
          <span style={{ fontFamily: FONT_MONO, fontSize: 18, color: C.ink, fontWeight: 500 }}>~${msg.estimate}</span>
          <FairPriceBadge estimate={msg.estimate} costRange={msg.costRange} />
        </div>
      </div>
      <div className="px-4 pb-4">
        <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Pick a time</div>
        <div className="grid grid-cols-2 gap-2">
          {SLOTS.map((s) => (
            <button key={s} onClick={() => onChoose(msg, s)} disabled={!!msg.chosenSlot} className="py-2 rounded-xl" style={{ fontFamily: FONT_BODY, fontSize: 12, border: `1px solid ${msg.chosenSlot === s ? C.accent : C.border}`, background: msg.chosenSlot === s ? C.accentSoft : "transparent", color: msg.chosenSlot === s ? C.accentDark : C.ink, fontWeight: msg.chosenSlot === s ? 600 : 400 }}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConfirmedCard({ msg }) {
  return (
    <div className="rounded-3xl p-4" style={{ background: C.ink, maxWidth: 300 }}>
      <div className="flex items-center gap-2 mb-2" style={{ color: C.accentSoft }}>
        <CheckCircle2 size={16} />
        <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600 }}>You're booked</span>
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: "#fff" }}>{msg.contractor.name}</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: "#D8D2C7", marginTop: 4 }}>{msg.slot}</div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: "#D8D2C7", marginTop: 2 }}>~${msg.estimate} estimate</div>
      {msg.photoUrl && <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: "#B9B2A4", marginTop: 8 }}>Your before photo is on file — they'll upload an after photo when the job's done.</div>}
    </div>
  );
}

/* ---------------------------------- HOME TAB ---------------------------------- */
function HomeTab({ messages, setMessages, addJob, nudges, activeProperty, pastJobs, seed, onSeedConsumed, canBook, onPaywallNeeded, subscription, prototypeMode, onRequestQuoteV1, onSetPrototypeMode, leadsByContractor, deepLinkTarget, onDeepLinkConsumed, onResetChat, conversations, activeConversationId, onOpenConversation, historyFlash }) {
  const [input, setInput] = useState("");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState([]);
  const [dismissedNotifIds, setDismissedNotifIds] = useState([]);

  const allNotifs = [
    ...NOTIF_ITEMS,
    ...(nudges || []).filter((n) => n.enabled).map((n) => ({ id: `nudge-${n.id}`, icon: n.icon, text: `Time to check: ${n.label}`, time: `Repeats ${n.freq.toLowerCase()} on ${n.day}` })),
  ].filter((n) => !dismissedNotifIds.includes(n.id));

  function toggleNotifRead(id) {
    setReadNotifIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function dismissNotif(id) {
    setDismissedNotifIds((prev) => [...prev, id]);
  }
  const [showEmergency, setShowEmergency] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const idRef = useRef(1);
  const fileRef = useRef(null);
  const scrollRef = useRef(null);
  const nextId = () => idRef.current++;

  function pushFollowUp() {
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: nextId(), role: "ai", kind: "followup" }]);
    }, 1100);
  }

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  function pushUserAndAnalyze(userMsg) {
    setMessages((prev) => [...prev, { id: nextId(), role: "user", ...userMsg }]);
    const typingId = nextId();
    setMessages((prev) => [...prev, { id: typingId, role: "ai", kind: "typing" }]);
    const isMedia = userMsg.kind === "photo" || userMsg.kind === "video";
    let preset = isMedia ? ISSUE_PRESETS.water_stain : matchIssue(userMsg.text);
    if (!isMedia && preset === ISSUE_PRESETS.generic) {
      preset = { ...preset, title: deriveGenericTitle(userMsg.text) };
    }
    setTimeout(() => {
      const repeatJob = (pastJobs || []).find((j) => j.trade === preset.trade) || null;
      setMessages((prev) => prev.map((m) => (m.id === typingId ? { id: typingId, role: "ai", kind: "diagnosis", data: preset, fromPhoto: isMedia, mediaKind: userMsg.kind, photoUrl: userMsg.photoUrl || null, repeatJob, handled: null } : m)));
    }, 1400);
  }

  useEffect(() => {
    if (seed) {
      pushUserAndAnalyze({ kind: "text", text: seed.text });
      onSeedConsumed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  useEffect(() => {
    if (!deepLinkTarget) return;
    if (deepLinkTarget === "emergency") setShowEmergency(true);
    if (deepLinkTarget === "homeNotifs") setShowNotifs(true);
    onDeepLinkConsumed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkTarget]);

  function handleSend() {
    if (!input.trim()) return;
    if (!canBook) {
      onPaywallNeeded();
      return;
    }
    pushUserAndAnalyze({ kind: "text", text: input.trim() });
    setInput("");
  }

  function handleChip(key) {
    if (!canBook) {
      onPaywallNeeded();
      return;
    }
    pushUserAndAnalyze({ kind: "text", text: CHIP_TEXT[key] });
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!canBook) {
      onPaywallNeeded();
      e.target.value = "";
      return;
    }
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video/");
    e.target.value = "";

    if (isVideo) {
      // Real video diagnosis isn't built — the backend only analyzes still
      // images. Falls back to the category picker rather than pretending.
      pushMediaCheck({ kind: "video", photoUrl: url });
      return;
    }

    setMessages((prev) => [...prev, { id: nextId(), role: "user", kind: "photo", photoUrl: url }]);
    const typingId = nextId();
    setMessages((prev) => [...prev, { id: typingId, role: "ai", kind: "typing" }]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not logged in");
      if (!activeProperty?.id) throw new Error("No property to attach this to yet");

      const form = new FormData();
      form.append("photo", file);
      form.append("propertyId", activeProperty.id);

      const res = await fetch(`${BACKEND_URL}/api/diagnose`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: form,
      });
      if (!res.ok) throw new Error((await res.json())?.error || "Diagnosis request failed");
      const { diagnosis, photoUrl } = await res.json();

      // Low confidence — ask the follow-up question instead of showing a
      // guessed diagnosis as if it were certain.
      if (diagnosis.confidence === "low" && diagnosis.followUpQuestion) {
        setMessages((prev) => prev.map((m) => (m.id === typingId ? { id: typingId, role: "ai", kind: "text", text: diagnosis.followUpQuestion } : m)));
        return;
      }

      // Reshape into the same preset shape DiagnosisCard already renders,
      // synthesizing a video/article search query since the backend leaves
      // those for the frontend to fill in (see homeai-backend/README.md).
      const preset = {
        id: diagnosis.id,
        title: diagnosis.title,
        trade: diagnosis.trade,
        urgency: diagnosis.urgency,
        cause: diagnosis.cause,
        cost: diagnosis.cost,
        diy: diagnosis.diy,
        diyNote: diagnosis.diyNote,
        emergency: diagnosis.emergency,
        diyGuide: diagnosis.diyGuide
          ? {
              ...diagnosis.diyGuide,
              video: { title: `How to fix: ${diagnosis.title}`, channel: "", query: `${diagnosis.title} diy fix tutorial` },
              articleQuery: `how to fix ${diagnosis.title}`,
            }
          : undefined,
      };

      const repeatJob = (pastJobs || []).find((j) => j.trade === preset.trade) || null;
      setMessages((prev) => prev.map((m) => (m.id === typingId ? { id: typingId, role: "ai", kind: "diagnosis", data: preset, fromPhoto: true, mediaKind: "photo", photoUrl: photoUrl || url, repeatJob, handled: null } : m)));
    } catch (err) {
      console.error("Real diagnosis failed, falling back to the category picker:", err);
      setMessages((prev) => prev.map((m) => (m.id === typingId ? { id: typingId, role: "ai", kind: "mediaCheck", photoUrl: url, mediaKind: "photo" } : m)));
    }
  }

  function pushMediaCheck(userMsg) {
    setMessages((prev) => [...prev, { id: nextId(), role: "user", ...userMsg }]);
    setMessages((prev) => [...prev, { id: nextId(), role: "ai", kind: "mediaCheck", photoUrl: userMsg.photoUrl, mediaKind: userMsg.kind }]);
  }

  function handleMediaCheckSelect(msg, presetKey) {
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { id: msg.id, role: "ai", kind: "typing" } : m)));
    let preset = ISSUE_PRESETS[presetKey] || ISSUE_PRESETS.generic;
    if (preset === ISSUE_PRESETS.generic) {
      preset = { ...preset, title: msg.mediaKind === "video" ? "Video from home" : "Photo from home" };
    }
    setTimeout(() => {
      const repeatJob = (pastJobs || []).find((j) => j.trade === preset.trade) || null;
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { id: msg.id, role: "ai", kind: "diagnosis", data: preset, fromPhoto: true, mediaKind: msg.mediaKind, photoUrl: msg.photoUrl, repeatJob, handled: null } : m)));
    }, 1200);
  }

  function handleDiy(msg) {
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, handled: "diy" } : m)));
    setMessages((prev) => [...prev, { id: nextId(), role: "ai", kind: "text", text: "Got it — marked as handled. I'll check back in a couple weeks in case it comes up again." }]);
    addJob({ title: msg.data.title, status: "Handled myself", type: "diy", beforePhoto: msg.photoUrl || null, afterPhoto: null });
  }

  function handleFindPro(msg) {
    if (msg.data.emergency) {
      setMessages((prev) => [...prev, { id: nextId(), role: "ai", kind: "text", text: "Leave the house, don't flip any switches, and call your gas provider's emergency line or 911 from outside. Once it's safe, I can help you get an inspection booked." }]);
      return;
    }
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, handled: "pro" } : m)));
    setMessages((prev) => [...prev, { id: nextId(), role: "ai", kind: "contractors", phase: "select", trade: msg.data.trade, issueTitle: msg.data.title, photoUrl: msg.photoUrl || null, propertyLabel: activeProperty?.address || null, selected: {} }]);
  }

  function handleBookAgain(msg) {
    const d = msg.data;
    const repeat = msg.repeatJob;
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, handled: "pro" } : m)));
    const record = findContractorRecord(d.trade, repeat.contractor) || { name: repeat.contractor, rating: 4.9, reviews: 30, price: "$", address: activeProperty?.address || "", source: "homeai" };
    const estimate = estimateForTier(d.cost, record.price || "$");
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "ai", kind: "booking", contractor: record, issueTitle: d.title, estimate, costRange: d.cost, trade: d.trade, chosenSlot: null, photoUrl: msg.photoUrl, repeatBooking: true },
    ]);
  }

  function handleToggleSelect(msg, name) {
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, selected: { ...m.selected, [name]: !m.selected?.[name] } } : m)));
  }

  function handleRequestQuotes(msg) {
    const list = CONTRACTORS[msg.trade] || CONTRACTORS.Handyman;
    const chosen = list.filter((c) => msg.selected?.[c.name]);
    if (chosen.length === 0) return;
    const selectedNames = chosen.map((c) => c.name);

    if (prototypeMode === "v1") {
      if (!canBook) {
        onPaywallNeeded();
        return;
      }
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, phase: "v1sent", selectedNames } : m)));
      onRequestQuoteV1(msg.trade, msg.issueTitle, msg.photoUrl, selectedNames);
      pushFollowUp();
      return;
    }

    const isPremium = subscription?.status !== "free" && subscription?.plan === "premium";
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, phase: "gathering", selectedNames, isPremium } : m)));
    setTimeout(() => {
      const costRange = currentCostFor(msg.trade);
      const quotes = chosen.map((c) => ({ ...c, estimate: estimateForTier(costRange, c.price), availableSlots: pickSlots() }));
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, phase: "compare", quotes, costRange, bookedWith: null } : m)));
    }, isPremium ? 900 : 1800);
  }

  function handleBookFromCompare(msg, quote, slot) {
    if (!canBook) {
      onPaywallNeeded();
      return;
    }
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, bookedWith: quote.name, chosenSlots: { ...(m.chosenSlots || {}), [quote.name]: slot } } : m)));
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: nextId(), role: "ai", kind: "confirmed", contractor: quote, slot, estimate: quote.estimate, issueTitle: msg.issueTitle, photoUrl: msg.photoUrl }]);
      addJob({ title: msg.issueTitle, trade: msg.trade || null, status: "Scheduled", type: "job", flowVersion: "v2", contractor: quote.name, slot, estimate: quote.estimate, beforePhoto: msg.photoUrl || null, afterPhoto: null });
      pushFollowUp();
    }, 500);
  }

  function handleChooseSlot(msg, slot) {
    if (!canBook) {
      onPaywallNeeded();
      return;
    }
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, chosenSlot: slot } : m)));
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: nextId(), role: "ai", kind: "confirmed", contractor: msg.contractor, slot, estimate: msg.estimate, issueTitle: msg.issueTitle, photoUrl: msg.photoUrl }]);
      addJob({ title: msg.issueTitle, trade: msg.trade || null, status: "Scheduled", type: "job", flowVersion: "v2", contractor: msg.contractor.name, slot, estimate: msg.estimate, beforePhoto: msg.photoUrl || null, afterPhoto: null });
      pushFollowUp();
    }, 400);
  }

  function handleBannerTap() {
    setMessages([{ id: nextId(), role: "ai", kind: "text", text: CURRENT_WEATHER_ADVISORY.chatText }]);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <div>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: C.ink, fontWeight: 500 }}>HomeAi</span>
          {activeProperty && (
            <div className="flex items-center gap-1 mt-0.5" style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint }}>
              <Building2 size={10} /> {activeProperty.nickname}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-full p-0.5" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
            {["v1", "v2"].map((m) => (
              <button
                key={m}
                onClick={() => onSetPrototypeMode(m)}
                className="px-2.5 py-1 rounded-full"
                style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, background: prototypeMode === m ? C.ink : "transparent", color: prototypeMode === m ? "#fff" : C.inkFaint }}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>
          {messages.length > 0 && <button onClick={onResetChat} style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.inkSoft }}>New</button>}
          <button onClick={() => setShowHistory((v) => !v)} className="relative">
            <MessageCircle size={16} color={historyFlash ? C.accent : C.inkSoft} />
            {conversations.length > 0 && (
              <span
                className="flex items-center justify-center"
                style={{ position: "absolute", top: -5, right: -6, minWidth: 13, height: 13, borderRadius: 999, background: C.accent, padding: "0 2px", animation: historyFlash ? "homeaiBadgeFlash 0.5s ease-in-out 4" : "none" }}
              >
                <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: "#fff", fontWeight: 700 }}>{conversations.length}</span>
              </span>
            )}
          </button>
          <button onClick={() => setShowEmergency((v) => !v)}>
            <PhoneCall size={16} color={C.brick} />
          </button>
          <button onClick={() => setShowNotifs((v) => !v)} className="relative">
            <Bell size={17} color={C.inkSoft} />
            {allNotifs.some((n) => !readNotifIds.includes(n.id)) && (
              <span style={{ position: "absolute", top: -1, right: -1, width: 6, height: 6, borderRadius: 999, background: C.brick }} />
            )}
          </button>
        </div>
      </div>

      {showHistory && (
        <div className="mx-5 mb-2 rounded-2xl p-3" style={{ background: C.surface, border: `1px solid ${C.border}`, maxHeight: 260, overflowY: "auto" }}>
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5 }}>Past conversations</span>
            <button onClick={() => setShowHistory(false)}><X size={13} color={C.inkFaint} /></button>
          </div>
          {conversations.length === 0 ? (
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.inkFaint, padding: "6px 0" }}>Nothing saved yet — start a chat, then tap "New" to keep it here.</div>
          ) : (
            <div className="space-y-1.5 mt-1">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onOpenConversation(c.id);
                    setShowHistory(false);
                  }}
                  className="w-full text-left rounded-xl p-2.5 flex items-center justify-between"
                  style={{ background: c.id === activeConversationId ? C.accentSoft : C.bg, border: `1px solid ${c.id === activeConversationId ? C.accent : C.border}` }}
                >
                  <span style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12.5, color: C.ink }}>{c.title}</span>
                  <ChevronRight size={14} color={C.inkFaint} style={{ flexShrink: 0 }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showEmergency && (
        <div className="mx-5 mb-2 rounded-2xl p-3" style={{ background: C.brickSoft, border: `1px solid ${C.brick}55` }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.brick, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, fontWeight: 700 }}>Emergency contacts</div>
          <div className="space-y-1.5">
            {EMERGENCY_CONTACTS.map((c) => (
              <a key={c.label} href={`tel:${c.phone}`} className="flex items-center justify-between">
                <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.ink }}>{c.label}</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.brick, fontWeight: 700 }}>{c.phone}</span>
              </a>
            ))}
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 9.5, color: C.brick, marginTop: 6, opacity: 0.8 }}>Placeholder numbers for this demo — replace with real local lines.</div>
        </div>
      )}

      {showNotifs && (
        <div className="mx-5 mb-2 rounded-2xl p-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5 }}>Notifications</span>
            {allNotifs.length > 0 && (
              <button onClick={() => setDismissedNotifIds((prev) => [...prev, ...allNotifs.map((n) => n.id)])} style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.accentDark, fontWeight: 600 }}>
                Clear all
              </button>
            )}
          </div>
          {allNotifs.length === 0 ? (
            <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: C.inkFaint, padding: "6px 0" }}>You're all caught up.</div>
          ) : (
            allNotifs.map((n) => {
              const read = readNotifIds.includes(n.id);
              return (
                <div key={n.id} className="flex items-start gap-2 py-1.5" style={{ opacity: read ? 0.55 : 1 }}>
                  <button onClick={() => toggleNotifRead(n.id)} className="flex items-center justify-center flex-shrink-0" style={{ width: 15, height: 15, borderRadius: 5, border: `1.5px solid ${read ? C.sage : C.inkFaint}`, background: read ? C.sage : "transparent", marginTop: 2 }}>
                    {read && <CheckCircle2 size={10} color="#fff" />}
                  </button>
                  <n.icon size={13} color={C.accentDark} style={{ marginTop: 2, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.ink, lineHeight: 1.35 }}>{n.text}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.inkFaint }}>{n.time}</div>
                  </div>
                  <button onClick={() => dismissNotif(n.id)} className="flex-shrink-0" style={{ marginTop: 2 }}>
                    <X size={13} color={C.inkFaint} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {!bannerDismissed && (
        <div className="mx-5 mb-2 rounded-2xl p-3 flex items-start gap-3" style={{ background: C.accentSoft, border: `1px solid ${C.accent}55` }}>
          <button onClick={handleBannerTap} className="flex items-start gap-3 flex-1 text-left">
            <CURRENT_WEATHER_ADVISORY.icon size={16} color={C.accentDark} style={{ marginTop: 1, flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12.5, color: C.accentDark }}>{CURRENT_WEATHER_ADVISORY.title}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.accentDark, opacity: 0.8, marginTop: 1 }}>{CURRENT_WEATHER_ADVISORY.subtitle}</div>
            </div>
          </button>
          <button onClick={() => setBannerDismissed(true)}><X size={14} color={C.accentDark} /></button>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4">
        {!canBook ? (
          <div className="flex flex-col items-center pt-10 pb-4 text-center">
            <div className="flex items-center justify-center mb-5" style={{ width: 76, height: 76, borderRadius: 999, background: C.amberSoft }}>
              <ShieldCheck size={30} color={C.amber} />
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: C.ink, marginBottom: 8 }}>You've used your free projects</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.inkSoft, lineHeight: 1.5, maxWidth: 260, marginBottom: 20 }}>
              This home has already used its 2 free projects. Pick a plan to keep diagnosing issues, tracking your home, and getting help — it only takes a minute.
            </div>
            <button onClick={onPaywallNeeded} className="w-full py-3 rounded-2xl" style={{ background: C.ink, color: "#fff", fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, maxWidth: 240 }}>
              See plans
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center pt-6 pb-4">
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: C.ink, textAlign: "center", lineHeight: 1.25 }}>
              What's going on
              <br />at home today?
            </div>
            <button onClick={() => fileRef.current?.click()} className="mt-7 flex items-center justify-center" style={{ width: 92, height: 92, borderRadius: 999, background: `radial-gradient(circle at 35% 30%, ${C.accent}, ${C.accentDark})`, boxShadow: `0 8px 24px -6px ${C.accent}88` }}>
              <Camera size={30} color="#fff" />
            </button>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.inkFaint, marginTop: 10 }}>Show me the issue — photo or video</div>
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handlePhoto} />

            <div className="flex flex-wrap gap-2 justify-center mt-8">
              {Object.keys(CHIP_TEXT).map((key) => (
                <button key={key} onClick={() => handleChip(key)} className="px-3 py-2 rounded-full" style={{ border: `1px solid ${C.border}`, background: C.surface, fontFamily: FONT_BODY, fontSize: 12.5, color: C.ink }}>
                  {{ water_stain: "Water stain on ceiling", ac_noise: "AC making noise", outlet: "Outlet not working", gas_smell: "Smell of gas", driveway_wash: "Driveway pressure washing", furniture_assembly: "Furniture assembly" }[key]}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-3 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "user" && m.kind === "text" && <div className="rounded-2xl px-4 py-2.5" style={{ background: C.ink, color: "#fff", maxWidth: 240, fontFamily: FONT_BODY, fontSize: 13.5 }}>{m.text}</div>}
                {m.role === "user" && m.kind === "photo" && <img src={m.photoUrl} alt="upload" className="rounded-2xl" style={{ width: 160, height: 160, objectFit: "cover" }} />}
                {m.role === "user" && m.kind === "video" && (
                  <video src={m.photoUrl} controls className="rounded-2xl" style={{ width: 200, maxHeight: 220, objectFit: "cover", background: "#000" }} />
                )}
                {m.role === "ai" && m.kind === "typing" && <TypingBubble />}
                {m.role === "ai" && m.kind === "mediaCheck" && <MediaCheckCard msg={m} onSelect={handleMediaCheckSelect} />}
                {m.role === "ai" && m.kind === "followup" && !m.dismissed && (
                  <FollowUpCard
                    onNewProject={onResetChat}
                    onKeepAsking={() => setMessages((prev) => prev.map((mm) => (mm.id === m.id ? { ...mm, dismissed: true } : mm)))}
                  />
                )}
                {m.role === "ai" && m.kind === "text" && <div className="rounded-2xl px-4 py-2.5" style={{ background: C.surface, border: `1px solid ${C.border}`, maxWidth: 260, fontFamily: FONT_BODY, fontSize: 13.5, color: C.ink, lineHeight: 1.5 }}>{m.text}</div>}
                {m.role === "ai" && m.kind === "diagnosis" && <DiagnosisCard msg={m} onDiy={handleDiy} onFindPro={handleFindPro} onBookAgain={handleBookAgain} />}
                {m.role === "ai" && m.kind === "contractors" && <ContractorsCard msg={m} onToggleSelect={handleToggleSelect} onRequestQuotes={handleRequestQuotes} onBook={handleBookFromCompare} leadsByContractor={leadsByContractor} />}
                {m.role === "ai" && m.kind === "booking" && <BookingCard msg={m} onChoose={handleChooseSlot} />}
                {m.role === "ai" && m.kind === "confirmed" && <ConfirmedCard msg={m} />}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pb-3 pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 rounded-2xl px-3 py-2" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <button onClick={() => fileRef.current?.click()}><Camera size={18} color={C.inkSoft} /></button>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Describe the issue…" className="flex-1 bg-transparent outline-none" style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: C.ink }} />
          <button onClick={handleSend}><Send size={17} color={C.accent} /></button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- HISTORY TAB ---------------------------------- */
const CURRENT_STATUSES = ["Requested Quote", V1_TIMELINE_LABEL, "Scheduled", "On the way", "In progress"];
const PAST_STATUSES = ["Completed", "Handled myself"];

function ProjectRow({ j, properties, onOpenJob }) {
  const thumb = j.type === "recurring" ? j.visits?.[0]?.afterPhoto || j.visits?.[0]?.beforePhoto : j.beforePhoto;
  return (
    <button onClick={() => onOpenJob(j)} className="w-full text-left rounded-2xl p-3 flex items-center justify-between" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-3">
        {thumb ? (
          <img src={thumb} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover" }} />
        ) : (
          <div style={{ width: 40, height: 40, borderRadius: 10, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><ImageOff size={15} color={C.inkFaint} /></div>
        )}
        <div>
          <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13.5, color: C.ink }}>{j.title}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: C.inkFaint, marginTop: 2 }}>
            {j.type === "recurring"
              ? `${j.contractor} · ${j.frequency}`
              : j.contractor && j.scheduledDate ? `${j.contractor} · ${j.scheduledDate}` : j.contractor && j.slot ? `${j.contractor} · ${j.slot}` : j.contractor ? j.contractor : j.requestedContractors ? `Sent to ${j.requestedContractors.length} pro${j.requestedContractors.length !== 1 ? "s" : ""}` : "Marked as handled by you"}
          </div>
          {j.type === "recurring" && j.visits?.length > 0 && (
            <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.sage, marginTop: 1 }}>{j.visits.length} visit{j.visits.length !== 1 ? "s" : ""} logged</div>
          )}
          {properties && properties.length > 1 && j.homeNickname && (
            <div className="flex items-center gap-1 mt-0.5" style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.accentDark }}><Building2 size={9} /> {j.homeNickname}</div>
          )}
        </div>
      </div>
      <StatusChip status={j.status} />
    </button>
  );
}

function ProjectsTab({ jobs, onOpenJob, properties, nudges, onRequestFromNudge, deepLinkTarget, onDeepLinkConsumed }) {
  const [view, setView] = useState("current");
  const [filterHome, setFilterHome] = useState("all");

  useEffect(() => {
    if (!deepLinkTarget) return;
    if (deepLinkTarget === "current") setView("current");
    if (deepLinkTarget === "past") setView("past");
    if (deepLinkTarget === "potential") setView("potential");
    if (deepLinkTarget === "recurring") setView("recurring");
    onDeepLinkConsumed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkTarget]);

  const byStatus = view === "current" ? jobs.filter((j) => CURRENT_STATUSES.includes(j.status) && j.type !== "recurring") : view === "past" ? jobs.filter((j) => PAST_STATUSES.includes(j.status)) : view === "recurring" ? jobs.filter((j) => j.type === "recurring") : [];
  const visibleJobs = filterHome === "all" ? byStatus : byStatus.filter((j) => j.homeId === filterHome);
  const potential = (nudges || []).filter((n) => n.enabled);

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-5 pt-5 pb-3"><span style={{ fontFamily: FONT_DISPLAY, fontSize: 19, color: C.ink }}>Projects</span></div>

      <div className="flex gap-1.5 px-5 pb-2">
        {["current", "recurring", "past", "potential"].map((v) => (
          <button key={v} onClick={() => setView(v)} className="flex-1 py-1.5 rounded-full capitalize" style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, background: view === v ? C.ink : C.surface, color: view === v ? "#fff" : C.inkSoft, border: `1px solid ${view === v ? C.ink : C.border}` }}>
            {v}
          </button>
        ))}
      </div>

      {view !== "potential" && properties && properties.length > 1 && (
        <div className="flex gap-1.5 px-5 pb-3 overflow-x-auto">
          <button onClick={() => setFilterHome("all")} className="px-2.5 py-1 rounded-full flex-shrink-0" style={{ fontFamily: FONT_BODY, fontSize: 11, background: filterHome === "all" ? C.ink : "transparent", color: filterHome === "all" ? "#fff" : C.inkSoft, border: `1px solid ${filterHome === "all" ? C.ink : C.border}` }}>All properties</button>
          {properties.map((p) => (
            <button key={p.id} onClick={() => setFilterHome(p.id)} className="px-2.5 py-1 rounded-full flex-shrink-0" style={{ fontFamily: FONT_BODY, fontSize: 11, background: filterHome === p.id ? C.ink : "transparent", color: filterHome === p.id ? "#fff" : C.inkSoft, border: `1px solid ${filterHome === p.id ? C.ink : C.border}` }}>{p.nickname}</button>
          ))}
        </div>
      )}

      {view === "potential" ? (
        potential.length === 0 ? (
          <div className="px-5 pt-6 text-center"><div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.inkFaint, lineHeight: 1.5 }}>No recurring nudges are turned on for this property. Enable some in Profile and they'll show up here as suggested projects.</div></div>
        ) : (
          <div className="px-4 pt-1 pb-4">
            <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, marginBottom: 8 }}>Based on your recurring nudges — tap to start a request</div>
            <div className="space-y-2">
              {potential.map((n) => (
                <div key={n.id} className="rounded-2xl p-3 flex items-center gap-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <div className="flex items-center justify-center flex-shrink-0" style={{ width: 34, height: 34, borderRadius: 999, background: C.accentSoft }}>
                    <n.icon size={15} color={C.accentDark} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13, color: C.ink }}>{n.label}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint }}>Repeats {n.freq.toLowerCase()} · {n.day}</div>
                  </div>
                  <button onClick={() => onRequestFromNudge(n)} className="px-3 py-1.5 rounded-xl flex-shrink-0" style={{ background: C.ink, color: "#fff", fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 600 }}>Request</button>
                </div>
              ))}
            </div>
          </div>
        )
      ) : visibleJobs.length === 0 ? (
        <div className="px-5 pt-10 text-center">
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.inkFaint, lineHeight: 1.5 }}>
            {view === "current" ? "No projects in progress right now." : view === "recurring" ? "No ongoing services yet \u2014 schedule a contractor from a Recurring Nudge in Profile to set one up." : "No past projects yet — completed and DIY-handled issues will show up here."}
          </div>
        </div>
      ) : (
        <div className="px-4 space-y-2 pb-4">
          {visibleJobs.map((j) => (
            <ProjectRow key={j.id} j={j} properties={properties} onOpenJob={onOpenJob} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatusChip({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.Scheduled;
  return <span className="px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.fg, fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 500 }}>{status}</span>;
}

function StatusStepper({ status }) {
  const idx = STAGES.indexOf(status);
  return (
    <div>
      <div className="flex items-center mt-4">
        {STAGES.map((s, i) => (
          <React.Fragment key={s}>
            <div style={{ width: 9, height: 9, borderRadius: 999, background: i <= idx ? C.accent : C.border, flexShrink: 0 }} />
            {i < STAGES.length - 1 && <div style={{ flex: 1, height: 2, background: i < idx ? C.accent : C.border }} />}
          </React.Fragment>
        ))}
      </div>
      <div className="flex justify-between mt-1.5">
        {STAGES.map((s, i) => (
          <span key={s} style={{ fontFamily: FONT_BODY, fontSize: 8.5, color: s === status ? C.ink : C.inkFaint, fontWeight: s === status ? 600 : 400, textAlign: i === 0 ? "left" : i === STAGES.length - 1 ? "right" : "center", flex: i === 0 || i === STAGES.length - 1 ? "0 0 auto" : 1 }}>
            {s}
          </span>
        ))}
      </div>
      {status === "On the way" && <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.accentDark, marginTop: 8 }}>Arriving in ~18 min</div>}
    </div>
  );
}

function PhotoBox({ label, url, placeholder, action }) {
  return (
    <div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      {url ? (
        <div className="relative">
          <img src={url} alt={label} style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 14 }} />
          {label === "After" && (
            <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(35,47,56,0.85)" }}>
              <CheckCircle2 size={11} color={C.sageSoft} />
              <span style={{ fontFamily: FONT_BODY, fontSize: 9.5, color: "#fff" }}>By contractor</span>
            </div>
          )}
        </div>
      ) : action ? (
        <button onClick={action} className="w-full flex flex-col items-center justify-center gap-1" style={{ height: 120, borderRadius: 14, border: `1.5px dashed ${C.border}`, background: C.bg }}>
          <Camera size={16} color={C.inkFaint} />
          <span style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkSoft, textAlign: "center", padding: "0 8px" }}>{placeholder}</span>
        </button>
      ) : (
        <div className="flex flex-col items-center justify-center gap-1" style={{ height: 120, borderRadius: 14, background: C.bg }}>
          <ImageOff size={16} color={C.inkFaint} />
          <span style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint }}>{placeholder}</span>
        </div>
      )}
    </div>
  );
}

const WHEEL_ITEM_H = 36;
const WHEEL_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WHEEL_DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const WHEEL_TIMES = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"];

function WheelColumn({ options, selectedIndex, onChange }) {
  const ref = useRef(null);
  const scrollTimeout = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = selectedIndex * WHEEL_ITEM_H;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ref.current) ref.current.scrollTo({ top: selectedIndex * WHEEL_ITEM_H, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex]);

  function handleScroll(e) {
    const top = e.target.scrollTop;
    clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      const idx = Math.max(0, Math.min(options.length - 1, Math.round(top / WHEEL_ITEM_H)));
      if (idx !== selectedIndex) onChange(idx);
    }, 120);
  }

  function selectByClick(i) {
    onChange(i);
  }

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      className="flex-1 overflow-y-scroll no-scrollbar"
      style={{ height: WHEEL_ITEM_H * 3, scrollSnapType: "y mandatory" }}
    >
      <div style={{ height: WHEEL_ITEM_H }} />
      {options.map((opt, i) => (
        <button
          key={opt}
          type="button"
          onClick={() => selectByClick(i)}
          className="w-full"
          style={{
            height: WHEEL_ITEM_H,
            scrollSnapAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT_BODY,
            fontWeight: i === selectedIndex ? 700 : 400,
            fontSize: i === selectedIndex ? 15 : 13.5,
            color: i === selectedIndex ? C.ink : C.inkFaint,
            transition: "font-size 0.1s, color 0.1s",
          }}
        >
          {opt}
        </button>
      ))}
      <div style={{ height: WHEEL_ITEM_H }} />
    </div>
  );
}

function ScheduleWheelPicker({ onChange }) {
  const [monthIdx, setMonthIdx] = useState(0);
  const [dayIdx, setDayIdx] = useState(0);
  const [timeIdx, setTimeIdx] = useState(1);

  useEffect(() => {
    onChange(`${WHEEL_MONTHS[monthIdx]} ${WHEEL_DAYS[dayIdx]}, ${WHEEL_TIMES[timeIdx]}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthIdx, dayIdx, timeIdx]);

  return (
    <div className="relative">
      <div
        className="absolute left-0 right-0 pointer-events-none rounded-xl"
        style={{ top: WHEEL_ITEM_H, height: WHEEL_ITEM_H, background: C.accentSoft, border: `1px solid ${C.accent}55` }}
      />
      <div className="flex">
        <WheelColumn options={WHEEL_MONTHS} selectedIndex={monthIdx} onChange={setMonthIdx} />
        <WheelColumn options={WHEEL_DAYS} selectedIndex={dayIdx} onChange={setDayIdx} />
        <WheelColumn options={WHEEL_TIMES} selectedIndex={timeIdx} onChange={setTimeIdx} />
      </div>
    </div>
  );
}

function V1JobDetailScreen({ job, onBack, onPatchJob, onViewContractor }) {
  const [step, setStep] = useState("idle");
  const [tempContractor, setTempContractor] = useState(null);
  const [tempPrice, setTempPrice] = useState("");
  const [tempDate, setTempDate] = useState("");
  const [receiptUrl, setReceiptUrl] = useState(null);
  const fileRef = useRef(null);

  function handleReceiptFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptUrl(URL.createObjectURL(file));
    e.target.value = "";
  }

  function finishReceipt(skip) {
    onPatchJob(job.id, { status: "Completed", receiptPhoto: skip ? job.receiptPhoto || null : receiptUrl });
    setStep("idle");
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 pt-5 pb-3">
        <button onClick={onBack}><ChevronLeft size={20} color={C.ink} /></button>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: C.ink }}>Job details</span>
      </div>
      <div className="px-5 flex-1 overflow-y-auto pb-4">
        <div className="rounded-3xl p-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: C.ink }}>{job.title}</div>
          <div className="mt-3 space-y-2" style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.inkSoft }}>
            {job.contractor ? (
              <button onClick={() => onViewContractor(job.contractor, job.trade, { lastJob: job.title, lastDate: job.scheduledDate })} className="flex items-center gap-2" style={{ color: C.accentDark, fontWeight: 600 }}>
                <User size={14} /> {job.contractor} <ChevronRight size={13} />
              </button>
            ) : (
              <div className="flex items-start gap-2"><User size={14} style={{ marginTop: 2 }} /> Sent to {job.requestedContractors?.join(", ")}</div>
            )}
            {job.quotedPrice != null && <div className="flex items-center gap-2" style={{ fontFamily: FONT_MONO }}><CreditCard size={14} /> ${job.quotedPrice} quoted</div>}
            {job.scheduledDate && <div className="flex items-center gap-2"><Clock size={14} /> {job.scheduledDate}</div>}
          </div>
          <div className="mt-4"><StatusChip status={job.status} /></div>
        </div>

        {/* Requested Quote — waiting to hear back */}
        {job.status === "Requested Quote" && step === "idle" && (
          <div className="mt-4">
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.inkSoft, lineHeight: 1.5 }}>
              They'll reach out to you directly. Once you've heard back, check in below so we can keep good records on your home for next time.
            </div>
            <button onClick={() => setStep("heardBack")} className="w-full mt-3 py-2.5 rounded-2xl flex items-center justify-center gap-1.5" style={{ border: `1.5px solid ${C.accent}`, color: C.accentDark, fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700 }}>
              Simulate: check in after a few days
            </button>
          </div>
        )}

        {step === "heardBack" && (
          <div className="mt-4 rounded-2xl p-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 10 }}>Have you heard back from a contractor yet?</div>
            <div className="flex gap-2">
              <button onClick={() => setStep("idle")} className="flex-1 py-2 rounded-xl" style={{ border: `1px solid ${C.border}`, color: C.inkSoft, fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600 }}>Not yet</button>
              <button onClick={() => setStep("contractor")} className="flex-1 py-2 rounded-xl" style={{ background: C.ink, color: "#fff", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600 }}>Yes</button>
            </div>
          </div>
        )}

        {step === "contractor" && (
          <div className="mt-4 rounded-2xl p-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 10 }}>Which contractor got back to you?</div>
            <div className="flex flex-wrap gap-1.5">
              {(job.requestedContractors || []).map((name) => (
                <button key={name} onClick={() => { setTempContractor(name); setStep("price"); }} className="px-3 py-1.5 rounded-full" style={{ border: `1px solid ${C.border}`, fontFamily: FONT_BODY, fontSize: 12, color: C.ink }}>
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "price" && (
          <div className="mt-4 rounded-2xl p-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 8 }}>How much were you quoted?</div>
            <div className="flex items-center rounded-xl mb-2" style={{ border: `1px solid ${C.border}` }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 14, color: C.inkSoft, paddingLeft: 12, paddingRight: 2 }}>$</span>
              <input value={tempPrice} onChange={(e) => setTempPrice(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="280" className="flex-1 px-1 py-2 rounded-xl outline-none" style={{ fontFamily: FONT_MONO, fontSize: 14 }} />
            </div>
            <PrimaryButton disabled={!tempPrice} onClick={() => setStep("movingForward")}>Continue</PrimaryButton>
          </div>
        )}

        {step === "movingForward" && (
          <div className="mt-4 rounded-2xl p-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 10 }}>Are you moving forward with {tempContractor}?</div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onPatchJob(job.id, { declinedQuotes: [...(job.declinedQuotes || []), { contractor: tempContractor, price: Number(tempPrice) }] });
                  setStep("idle");
                  setTempContractor(null);
                  setTempPrice("");
                }}
                className="flex-1 py-2 rounded-xl"
                style={{ border: `1px solid ${C.border}`, color: C.inkSoft, fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600 }}
              >
                Not this time
              </button>
              <button
                onClick={() => {
                  onPatchJob(job.id, { status: V1_TIMELINE_LABEL, contractor: tempContractor, quotedPrice: Number(tempPrice) });
                  setStep("scheduleDate");
                }}
                className="flex-1 py-2 rounded-xl"
                style={{ background: C.ink, color: "#fff", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600 }}
              >
                Yes
              </button>
            </div>
          </div>
        )}

        {(step === "scheduleDate" || (job.status === V1_TIMELINE_LABEL && !job.scheduledDate)) && (
          <div className="mt-4 rounded-2xl p-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 8 }}>When's the work scheduled for?</div>
            <div className="mb-3"><ScheduleWheelPicker onChange={setTempDate} /></div>
            <PrimaryButton
              disabled={!tempDate}
              onClick={() => {
                onPatchJob(job.id, { status: "Scheduled", scheduledDate: tempDate });
                setStep("idle");
                setTempDate("");
              }}
            >
              Save date
            </PrimaryButton>
            <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint, marginTop: 6, lineHeight: 1.4 }}>
              This helps us track how quickly pros get to the job, so future timing estimates are more accurate for you.
            </div>
          </div>
        )}

        {job.status === "Scheduled" && step !== "receipt" && (
          <div className="mt-5">
            <PrimaryButton onClick={() => setStep("receipt")}>Mark job as completed</PrimaryButton>
          </div>
        )}

        {step === "receipt" && (
          <div className="mt-4 rounded-2xl p-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 4 }}>Got a receipt?</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: C.inkSoft, marginBottom: 10, lineHeight: 1.4 }}>
              Snap a photo so we can keep accurate records for your home — handy for warranties and future projects.
            </div>
            {receiptUrl ? (
              <img src={receiptUrl} alt="receipt" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 12, marginBottom: 10 }} />
            ) : (
              <button onClick={() => fileRef.current?.click()} className="w-full flex flex-col items-center justify-center gap-1 mb-3" style={{ height: 100, borderRadius: 14, border: `1.5px dashed ${C.border}`, background: C.bg }}>
                <Camera size={16} color={C.inkFaint} />
                <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkSoft }}>Take a photo of your receipt</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleReceiptFile} />
            <div className="flex gap-2">
              <button onClick={() => finishReceipt(true)} className="flex-1 py-2 rounded-xl" style={{ border: `1px solid ${C.border}`, color: C.inkSoft, fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600 }}>Skip</button>
              <button onClick={() => finishReceipt(false)} disabled={!receiptUrl} className="flex-1 py-2 rounded-xl" style={{ background: receiptUrl ? C.ink : C.inkFaint, color: "#fff", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600 }}>Done</button>
            </div>
          </div>
        )}

        {job.status === "Completed" && (
          <div className="mt-4">
            <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Receipt</div>
            {job.receiptPhoto ? (
              <img src={job.receiptPhoto} alt="receipt" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 14 }} />
            ) : (
              <button onClick={() => fileRef.current?.click()} className="w-full flex flex-col items-center justify-center gap-1" style={{ height: 100, borderRadius: 14, border: `1.5px dashed ${C.border}`, background: C.bg }}>
                <Camera size={16} color={C.inkFaint} />
                <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkSoft }}>Add a receipt photo</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                onPatchJob(job.id, { receiptPhoto: URL.createObjectURL(file) });
                e.target.value = "";
              }}
            />
          </div>
        )}

        {job.status === "Completed" && (
          <div className="mt-4"><ReportIssueBox /></div>
        )}
      </div>
    </div>
  );
}

function RecurringJobDetailScreen({ job, onBack, onViewContractor, onLogVisit, onPatchJob }) {
  const [logging, setLogging] = useState(false);
  const [beforeUrl, setBeforeUrl] = useState(null);
  const [afterUrl, setAfterUrl] = useState(null);
  const beforeRef = useRef(null);
  const afterRef = useRef(null);

  function handleFile(e, which) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (which === "before") setBeforeUrl(url);
    else setAfterUrl(url);
    e.target.value = "";
  }

  function saveVisit() {
    onLogVisit(job.id, { date: "Today", beforePhoto: beforeUrl, afterPhoto: afterUrl });
    setBeforeUrl(null);
    setAfterUrl(null);
    setLogging(false);
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 pt-5 pb-3">
        <button onClick={onBack}><ChevronLeft size={20} color={C.ink} /></button>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: C.ink }}>Recurring service</span>
      </div>
      <div className="px-5 flex-1 overflow-y-auto pb-4">
        <div className="rounded-3xl p-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: C.ink }}>{job.title}</div>
          <div className="mt-3 space-y-2" style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.inkSoft }}>
            <button onClick={() => onViewContractor(job.contractor, job.trade, { lastJob: job.title, lastDate: job.visits?.[0]?.date })} className="flex items-center gap-2" style={{ color: C.accentDark, fontWeight: 600 }}>
              <User size={14} /> {job.contractor} <ChevronRight size={13} />
            </button>
            <div className="flex items-center gap-2"><Clock size={14} /> {job.frequency}</div>
          </div>
          <div className="mt-4"><StatusChip status={job.status} /></div>
        </div>

        {job.status === "Pending" && (
          <div className="mt-4 rounded-2xl p-3" style={{ background: C.amberSoft, border: `1px solid ${C.amber}55` }}>
            <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13, color: C.amber, marginBottom: 4 }}>Waiting on {job.contractor}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.amber, lineHeight: 1.4, marginBottom: 10 }}>
              This recurring contract isn't active yet — it starts once {job.contractor} confirms they can take it on.
            </div>
            <button onClick={() => onPatchJob(job.id, { status: "Active" })} className="w-full py-2.5 rounded-xl" style={{ background: C.ink, color: "#fff", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700 }}>
              Simulate: contractor confirmed
            </button>
          </div>
        )}

        {job.status === "Active" && (!logging ? (
          <button onClick={() => setLogging(true)} className="w-full mt-4 py-3 rounded-2xl flex items-center justify-center gap-2" style={{ background: C.ink, color: "#fff", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700 }}>
            <Camera size={15} /> Log today's visit
          </button>
        ) : (
          <div className="mt-4 rounded-2xl p-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 8 }}>Add before / after photos</div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button onClick={() => beforeRef.current?.click()} className="flex flex-col items-center justify-center gap-1" style={{ height: 90, borderRadius: 12, border: `1.5px dashed ${C.border}`, background: C.bg, overflow: "hidden" }}>
                {beforeUrl ? <img src={beforeUrl} alt="before" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <><Camera size={16} color={C.inkFaint} /><span style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkSoft }}>Before</span></>}
              </button>
              <button onClick={() => afterRef.current?.click()} className="flex flex-col items-center justify-center gap-1" style={{ height: 90, borderRadius: 12, border: `1.5px dashed ${C.border}`, background: C.bg, overflow: "hidden" }}>
                {afterUrl ? <img src={afterUrl} alt="after" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <><Camera size={16} color={C.inkFaint} /><span style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkSoft }}>After</span></>}
              </button>
            </div>
            <input ref={beforeRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, "before")} />
            <input ref={afterRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, "after")} />
            <div className="flex gap-2">
              <button onClick={() => setLogging(false)} className="flex-1 py-2 rounded-xl" style={{ border: `1px solid ${C.border}`, color: C.inkSoft, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600 }}>Cancel</button>
              <button onClick={saveVisit} className="flex-1 py-2 rounded-xl" style={{ background: C.ink, color: "#fff", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600 }}>Save visit</button>
            </div>
          </div>
        ))}

        <div className="mt-5">
          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Visit history</div>
          {(!job.visits || job.visits.length === 0) ? (
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.inkSoft }}>No visits logged yet.</div>
          ) : (
            <div className="space-y-2">
              {job.visits.map((v, i) => (
                <div key={i} className="rounded-2xl p-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12.5, color: C.ink, marginBottom: v.beforePhoto || v.afterPhoto ? 8 : 0 }}>{v.date}</div>
                  {(v.beforePhoto || v.afterPhoto) && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        {v.beforePhoto ? <img src={v.beforePhoto} alt="before" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 10 }} /> : <div style={{ width: "100%", height: 80, borderRadius: 10, background: C.bg }} />}
                        <div style={{ fontFamily: FONT_BODY, fontSize: 9.5, color: C.inkFaint, textAlign: "center", marginTop: 2 }}>Before</div>
                      </div>
                      <div>
                        {v.afterPhoto ? <img src={v.afterPhoto} alt="after" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 10 }} /> : <div style={{ width: "100%", height: 80, borderRadius: 10, background: C.bg }} />}
                        <div style={{ fontFamily: FONT_BODY, fontSize: 9.5, color: C.inkFaint, textAlign: "center", marginTop: 2 }}>After</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function JobDetailScreen({ job, onBack, onComplete, onUploadAfterPhoto, onAdvanceStatus, onViewContractor, onExportClaim, onPatchJob, onLogVisit }) {
  if (job.flowVersion === "v1") {
    return <V1JobDetailScreen job={job} onBack={onBack} onPatchJob={onPatchJob} onViewContractor={onViewContractor} />;
  }
  if (job.type === "recurring") {
    return <RecurringJobDetailScreen job={job} onBack={onBack} onViewContractor={onViewContractor} onLogVisit={onLogVisit} onPatchJob={onPatchJob} />;
  }
  const fileRef = useRef(null);
  function handleAfterFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onUploadAfterPhoto(job.id, url);
    e.target.value = "";
  }
  const isJob = job.type === "job";
  const canComplete = isJob && job.status === "In progress" && !!job.afterPhoto;
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 pt-5 pb-3">
        <button onClick={onBack}><ChevronLeft size={20} color={C.ink} /></button>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: C.ink }}>Job details</span>
      </div>
      <div className="px-5 flex-1 overflow-y-auto pb-4">
        <div className="rounded-3xl p-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: C.ink }}>{job.title}</div>
          <div className="mt-3 space-y-2" style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.inkSoft }}>
            {job.contractor && (
              <button onClick={() => onViewContractor(job.contractor, job.trade, { lastJob: job.title, lastDate: job.slot })} className="flex items-center gap-2" style={{ color: C.accentDark, fontWeight: 600 }}>
                <User size={14} /> {job.contractor} <ChevronRight size={13} />
              </button>
            )}
            {job.slot && <div className="flex items-center gap-2"><Clock size={14} /> {job.slot}</div>}
            {job.estimate != null && <div className="flex items-center gap-2" style={{ fontFamily: FONT_MONO }}><CreditCard size={14} /> ~${job.estimate} estimate</div>}
          </div>
          <div className="mt-4"><StatusChip status={job.status} /></div>

          {isJob && job.status !== "Completed" && <StatusStepper status={job.status} />}

          {isJob && job.status !== "Completed" && job.status !== "In progress" && (
            <button onClick={() => onAdvanceStatus(job.id)} className="mt-3" style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: C.accentDark, fontWeight: 600 }}>
              Simulate: {job.status === "Scheduled" ? "pro is on the way →" : "pro has started the job →"}
            </button>
          )}
        </div>

        {isJob && (
          <div className="mt-4">
            <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Before &amp; after</div>
            <div className="grid grid-cols-2 gap-3">
              <PhotoBox label="Before" url={job.beforePhoto} placeholder="No photo provided" />
              <PhotoBox label="After" url={job.afterPhoto} placeholder="Waiting on the contractor's after photo" action={job.status !== "Completed" ? () => fileRef.current?.click() : null} />
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAfterFile} />
            {job.status !== "Completed" && !job.afterPhoto && (
              <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint, marginTop: 6 }}>
                For this prototype, tap the After box to simulate the contractor's upload — in the real app, they upload it from their own account before the job can close.
              </div>
            )}
          </div>
        )}

        {job.invoice && (
          <div className="mt-4">
            <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Invoice</div>
            <div className="rounded-2xl p-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between" style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.inkSoft }}>
                <span>{job.invoice.number}</span>
                <span>{job.invoice.date}</span>
              </div>
              <div className="mt-3 space-y-1.5" style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                {job.invoice.lineItems.map((li, i) => (
                  <div key={i} className="flex items-center justify-between" style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.ink }}>
                    <span>{li.label}</span>
                    <span style={{ fontFamily: FONT_MONO }}>${li.amount}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
                <span style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: C.ink }}>Total paid</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 600, color: C.ink }}>${job.invoice.total}</span>
              </div>
            </div>
            <button onClick={() => onExportClaim(job)} className="w-full mt-2 py-2.5 rounded-2xl flex items-center justify-center gap-1.5" style={{ border: `1.5px solid ${C.accent}`, color: C.accentDark, fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700 }}>
              <Receipt size={13} /> Export for insurance claim
            </button>
          </div>
        )}

        {job.status !== "Completed" && isJob && (
          <div className="mt-5">
            <PrimaryButton disabled={!canComplete} onClick={onComplete}>Mark job as completed</PrimaryButton>
            {!canComplete && (
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, textAlign: "center", marginTop: 8 }}>
                {job.status !== "In progress" ? "Waiting for the job to start before it can be marked complete." : "Waiting on the contractor's after photo before this job can be marked complete."}
              </div>
            )}
          </div>
        )}

        {job.status === "Completed" && isJob && (
          <div className="mt-5"><ReportIssueBox /></div>
        )}
      </div>
    </div>
  );
}

function ReportIssueBox() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="rounded-2xl p-3 flex items-start gap-2" style={{ background: C.sageSoft, border: `1px solid ${C.sage}55` }}>
        <CheckCircle2 size={15} color={C.sage} style={{ marginTop: 1, flexShrink: 0 }} />
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.sage, lineHeight: 1.4 }}>
          Thanks — a real person on our team will follow up within 24 hours. This doesn't go into a queue no one reads.
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full py-2.5 rounded-2xl flex items-center justify-center gap-1.5" style={{ border: `1px solid ${C.border}`, color: C.inkSoft, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600 }}>
        Something wrong with this job? Report it
      </button>
    );
  }

  return (
    <div className="rounded-2xl p-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12.5, color: C.ink, marginBottom: 6 }}>What happened?</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Tell us what went wrong — a real person reviews every report."
        className="w-full px-3 py-2 rounded-xl outline-none mb-2"
        rows={3}
        style={{ border: `1px solid ${C.border}`, fontFamily: FONT_BODY, fontSize: 12.5, resize: "none" }}
      />
      <div className="flex gap-2">
        <button onClick={() => setOpen(false)} className="flex-1 py-2 rounded-xl" style={{ border: `1px solid ${C.border}`, color: C.inkSoft, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600 }}>Cancel</button>
        <button onClick={() => setSent(true)} disabled={!text.trim()} className="flex-1 py-2 rounded-xl" style={{ background: text.trim() ? C.brick : C.inkFaint, color: "#fff", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600 }}>Send report</button>
      </div>
    </div>
  );
}

function ContractorProfileScreen({ contractor, onBack, onRequestAgain }) {
  if (!contractor) return null;
  const isHomeai = contractor.source === "homeai";
  const mapsQuery = encodeURIComponent(`${contractor.name} ${contractor.address || ""}`);
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 pt-5 pb-3">
        <button onClick={onBack}><ChevronLeft size={20} color={C.ink} /></button>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: C.ink }}>Contractor</span>
      </div>
      <div className="px-5 flex-1 overflow-y-auto pb-4">
        <div className="rounded-3xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="p-4" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-center mb-3" style={{ width: 52, height: 52, borderRadius: 999, background: C.accentSoft }}>
              <User size={22} color={C.accentDark} />
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 19, color: C.ink }}>{contractor.name}</div>
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.inkSoft }}>{contractor.trade}</span>
              {isHomeai ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: C.sageSoft, color: C.sage, fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: 600 }}>
                  <CheckCircle2 size={9} /> On HomeAi
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: C.accentSoft, color: C.accentDark, fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: 600 }}>
                  Google Business Profile
                </span>
              )}
            </div>
          </div>

          {contractor.rating != null && (
            <div className="p-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2">
                <Star size={18} fill={C.accent} color={C.accent} />
                <span style={{ fontFamily: FONT_MONO, fontSize: 20, color: C.ink, fontWeight: 500 }}>{contractor.rating}</span>
              </div>
              <div className="text-right">
                <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.inkSoft }}>{contractor.reviews ?? "—"} {isHomeai ? "reviews" : "Google reviews"}</div>
                {!isHomeai && <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.inkFaint, marginTop: 1 }}>via Google</div>}
                {isHomeai && (
                  <div className="flex items-center justify-end gap-1" style={{ marginTop: 2 }}>
                    <ShieldCheck size={10} color={C.sage} />
                    <span style={{ fontFamily: FONT_BODY, fontSize: 9.5, color: C.sage }}>From verified completed jobs</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {contractor.address && (
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${C.border}`, fontFamily: FONT_BODY, fontSize: 12.5, color: C.inkSoft }}>
              <MapPin size={14} color={C.inkFaint} /> {contractor.address}
            </div>
          )}

          {contractor.lastJob && (
            <div className="px-4 py-3" style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.inkFaint }}>
              You hired them for <span style={{ color: C.ink, fontWeight: 600 }}>{contractor.lastJob}</span> · {contractor.lastDate}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-3">
          {contractor.phone ? (
            <a href={`tel:${contractor.phone}`} className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl" style={{ background: C.ink, color: "#fff", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600 }}>
              <PhoneCall size={14} /> Call
            </a>
          ) : (
            <button disabled className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl" style={{ background: C.bg, color: C.inkFaint, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, border: `1px solid ${C.border}` }}>
              <PhoneCall size={14} /> Call
            </button>
          )}
          <button disabled className="flex-1 py-3 rounded-2xl" style={{ background: "transparent", color: C.inkFaint, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, border: `1px solid ${C.border}` }} title="Coming in v2: message contractors directly in the app">
            Message
          </button>
        </div>

        <a href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`} target="_blank" rel="noreferrer" className="w-full mt-2 py-3 rounded-2xl flex items-center justify-center gap-1.5" style={{ border: `1px solid ${C.border}`, color: C.accentDark, fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600 }}>
          View on Google Maps <ExternalLink size={12} />
        </a>

        {contractor.trade && (
          <button
            onClick={() => onRequestAgain(`I need ${contractor.trade.toLowerCase()} work done again, same as before with ${contractor.name}`)}
            className="w-full mt-4 py-3 rounded-2xl"
            style={{ background: C.accentSoft, color: C.accentDark, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600 }}
          >
            Request them again
          </button>
        )}
      </div>
    </div>
  );
}

function PlanCard({ planKey, billing, current, onStartTrial }) {
  const plan = SUBSCRIPTION_PLANS[planKey];
  const price = plan.pricing[billing];
  const cycle = BILLING_CYCLES.find((c) => c.id === billing);
  const perMonth = billing === "monthly" ? price : billing === "seasonal" ? price / 3 : price / 12;
  const isPremium = planKey === "premium";
  const isCurrent = current && current.plan === planKey && current.billing === billing && current.status !== "free";
  return (
    <div className="rounded-3xl overflow-hidden" style={{ background: C.surface, border: `1.5px solid ${isPremium ? C.accent : C.border}` }}>
      <div className="p-4" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: C.ink }}>{plan.name}</span>
          {isPremium && (
            <span className="px-2 py-0.5 rounded-full" style={{ background: C.accent, color: "#fff", fontFamily: FONT_MONO, fontSize: 9.5, fontWeight: 700 }}>PRIORITY</span>
          )}
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.inkSoft, marginTop: 2 }}>{plan.tagline}</div>
        <div className="flex items-baseline gap-1 mt-3">
          <span style={{ fontFamily: FONT_MONO, fontSize: 26, color: C.ink, fontWeight: 600 }}>${price}</span>
          <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.inkFaint }}>{cycle.period}</span>
        </div>
        {billing !== "monthly" && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.sage, fontWeight: 600, marginTop: 2 }}>~${perMonth.toFixed(2)}/mo equivalent</div>
        )}
      </div>
      <div className="p-4">
        <div className="space-y-1.5 mb-3">
          {plan.features.map((f) => (
            <div key={f} className="flex items-start gap-2">
              <CheckCircle2 size={14} color={C.sage} style={{ marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.ink, lineHeight: 1.4 }}>{f}</span>
            </div>
          ))}
        </div>
        <PrimaryButton disabled={isCurrent} onClick={() => onStartTrial(planKey, billing)} style={isPremium ? { background: C.accent } : {}}>
          {isCurrent ? "Current plan" : `Start ${TRIAL_MONTHS}-month free trial`}
        </PrimaryButton>
      </div>
    </div>
  );
}

function HomePassportScreen({ property, jobs, assets, onBack }) {
  const completed = (jobs || []).filter((j) => j.homeId === property?.id && j.status === "Completed");
  const receiptCount = [...(assets || []).filter((a) => a.receiptPhoto), ...completed.filter((j) => j.receiptPhoto)].length;
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 pt-5 pb-3">
        <button onClick={onBack}><ChevronLeft size={20} color={C.ink} /></button>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: C.ink }}>Home Passport</span>
      </div>
      <div className="px-5 flex-1 overflow-y-auto pb-4">
        <div className="rounded-3xl p-4" style={{ background: C.ink }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 19, color: "#fff" }}>{property?.nickname}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: "#D8D2C7", marginTop: 2 }}>{property?.address}{property?.unit ? `, Unit ${property.unit}` : ""}{property?.postal ? ` · ${property.postal}` : ""}</div>
          <div className="flex gap-4 mt-4">
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 20, color: "#fff", fontWeight: 700 }}>{completed.length}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: "#D8D2C7" }}>Projects done</div>
            </div>
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 20, color: "#fff", fontWeight: 700 }}>{(assets || []).length}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: "#D8D2C7" }}>Systems tracked</div>
            </div>
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 20, color: "#fff", fontWeight: 700 }}>{receiptCount}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: "#D8D2C7" }}>Receipts on file</div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Maintenance history</div>
          {completed.length === 0 ? (
            <div className="rounded-2xl p-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.inkSoft }}>Nothing completed yet — finished projects will build your home's record here.</div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {completed.map((j) => (
                <div key={j.id} className="rounded-2xl p-3 flex items-center justify-between" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <div className="min-w-0">
                    <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12.5, color: C.ink }}>{j.title}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, marginTop: 1 }}>{j.contractor} · {j.scheduledDate || j.slot}</div>
                  </div>
                  {(j.estimate ?? j.quotedPrice) != null && <span style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: C.ink, fontWeight: 700, flexShrink: 0 }}>${j.estimate ?? j.quotedPrice}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4">
          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Systems & warranties</div>
          {(assets || []).length === 0 ? (
            <div className="rounded-2xl p-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.inkSoft }}>No systems tracked yet.</div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {(assets || []).map((a) => (
                <div key={a.id} className="rounded-2xl p-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12.5, color: C.ink }}>{a.label}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, marginTop: 1 }}>{a.category} · Installed {a.installed}{a.warranty && a.warranty !== "—" ? ` · Warranty until ${a.warranty}` : ""}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="w-full mt-4 py-3 rounded-2xl flex items-center justify-center gap-2" style={{ background: C.ink, color: "#fff", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700 }}>
          <Share2 size={15} /> Share with a realtor or buyer
        </button>
        <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint, textAlign: "center", marginTop: 8, lineHeight: 1.4 }}>
          Everything here is assembled automatically from real activity on this home — no extra paperwork.
        </div>
      </div>
    </div>
  );
}

function ClaimSummaryScreen({ job, property, onBack }) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 pt-5 pb-3">
        <button onClick={onBack}><ChevronLeft size={20} color={C.ink} /></button>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: C.ink }}>Claim summary</span>
      </div>
      <div className="px-5 flex-1 overflow-y-auto pb-4">
        <div className="rounded-3xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="p-4" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Property</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: C.ink }}>{property?.nickname}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.inkSoft, marginTop: 1 }}>{property?.address}{property?.unit ? `, Unit ${property.unit}` : ""}{property?.postal ? ` · ${property.postal}` : ""}</div>
          </div>
          <div className="p-4" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Incident / project</div>
            <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 14, color: C.ink }}>{job.title}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.inkSoft, marginTop: 2 }}>Completed by {job.contractor} · {job.slot}</div>
          </div>
          {job.beforePhoto && job.afterPhoto && (
            <div className="p-4" style={{ borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Documentation</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <img src={job.beforePhoto} alt="before" style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 12 }} />
                  <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.inkFaint, marginTop: 3, textAlign: "center" }}>Before</div>
                </div>
                <div>
                  <img src={job.afterPhoto} alt="after" style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 12 }} />
                  <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.inkFaint, marginTop: 3, textAlign: "center" }}>After</div>
                </div>
              </div>
            </div>
          )}
          {job.invoice && (
            <div className="p-4">
              <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Invoice {job.invoice.number}</div>
              <div className="space-y-1.5">
                {job.invoice.lineItems.map((li, i) => (
                  <div key={i} className="flex items-center justify-between" style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.ink }}>
                    <span>{li.label}</span>
                    <span style={{ fontFamily: FONT_MONO }}>${li.amount}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
                <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13, color: C.ink }}>Total</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 15, fontWeight: 700, color: C.ink }}>${job.invoice.total}</span>
              </div>
            </div>
          )}
        </div>
        <button className="w-full mt-3 py-3 rounded-2xl flex items-center justify-center gap-2" style={{ background: C.ink, color: "#fff", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700 }}>
          <Share2 size={15} /> Share with insurer
        </button>
        <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint, textAlign: "center", marginTop: 8, lineHeight: 1.4 }}>
          Assembled automatically from your project record — photos, invoice, and dates, ready to attach to a claim.
        </div>
      </div>
    </div>
  );
}

function EditProfileScreen({ ownerName, ownerPhone, ownerEmail, ownerAddress, ownerPhoto, onSave, household, onAddHousehold, onDeleteHousehold, onBack }) {
  const [name, setName] = useState(ownerName);
  const [phone, setPhone] = useState(ownerPhone);
  const [email, setEmail] = useState(ownerEmail);
  const [address, setAddress] = useState(ownerAddress);
  const [photo, setPhoto] = useState(ownerPhoto);
  const [addingMember, setAddingMember] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [memberRelation, setMemberRelation] = useState(RELATION_OPTIONS[0]);
  const photoRef = useRef(null);

  function handlePhotoFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(URL.createObjectURL(file));
    e.target.value = "";
  }

  function save() {
    onSave({ name: name.trim() || ownerName, phone: phone.trim(), email: email.trim(), address: address.trim(), photo });
    onBack();
  }

  function saveMember() {
    if (!memberName.trim()) return;
    onAddHousehold(memberName.trim(), memberPhone.trim(), memberRelation);
    setMemberName("");
    setMemberPhone("");
    setAddingMember(false);
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 pt-5 pb-3">
        <button onClick={onBack}><ChevronLeft size={20} color={C.ink} /></button>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: C.ink }}>Your profile</span>
      </div>
      <div className="px-5 flex-1 overflow-y-auto pb-4">
        <div className="flex flex-col items-center mb-5">
          <button onClick={() => photoRef.current?.click()} className="relative flex items-center justify-center" style={{ width: 78, height: 78, borderRadius: 999, background: C.accentSoft, overflow: "hidden" }}>
            {photo ? <img src={photo} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={32} color={C.accentDark} />}
            <div className="absolute flex items-center justify-center" style={{ bottom: 0, right: 0, width: 26, height: 26, borderRadius: 999, background: C.ink, border: `2px solid ${C.bg}` }}>
              <Camera size={12} color="#fff" />
            </div>
          </button>
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoFile} />
          <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, marginTop: 8 }}>Tap to change photo</span>
        </div>

        <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>Name</div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full px-3 py-2.5 rounded-xl outline-none mb-3" style={{ border: `1px solid ${C.border}`, fontFamily: FONT_BODY, fontSize: 13.5, background: C.surface }} />

        <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>Phone</div>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(604) 555-0100" className="w-full px-3 py-2.5 rounded-xl outline-none mb-3" style={{ border: `1px solid ${C.border}`, fontFamily: FONT_BODY, fontSize: 13.5, background: C.surface }} />

        <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>Email</div>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-3 py-2.5 rounded-xl outline-none mb-3" style={{ border: `1px solid ${C.border}`, fontFamily: FONT_BODY, fontSize: 13.5, background: C.surface }} />

        <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>Mailing address</div>
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city, province" className="w-full px-3 py-2.5 rounded-xl outline-none mb-4" style={{ border: `1px solid ${C.border}`, fontFamily: FONT_BODY, fontSize: 13.5, background: C.surface }} />

        <PrimaryButton onClick={save}>Save changes</PrimaryButton>

        <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 20, marginBottom: 6 }}>Household</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: C.inkSoft, marginBottom: 8, lineHeight: 1.4 }}>Give family or a caregiver access to this home. Their number is on file so a contractor can reach them directly if needed.</div>
        {household.length === 0 ? (
          <div className="rounded-xl p-2.5 mb-2" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.inkSoft, lineHeight: 1.4 }}>No one added yet.</div>
          </div>
        ) : (
          <div className="space-y-1.5 mb-2">
            {household.map((m) => (
              <div key={m.id} className="rounded-xl p-2.5 flex items-center gap-2.5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-center flex-shrink-0" style={{ width: 28, height: 28, borderRadius: 999, background: C.accentSoft }}>
                  <Users size={13} color={C.accentDark} />
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12.5, color: C.ink }}>{m.name}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint }}>{m.relation}{m.phone ? ` \u00b7 ${m.phone}` : ""}</div>
                </div>
                {m.phone && (
                  <a href={`tel:${m.phone}`} className="flex items-center justify-center flex-shrink-0" style={{ width: 26, height: 26, borderRadius: 999, background: C.bg }}>
                    <PhoneCall size={12} color={C.accentDark} />
                  </a>
                )}
                <button onClick={() => onDeleteHousehold(m.id)}><Trash2 size={13} color={C.brick} /></button>
              </div>
            ))}
          </div>
        )}
        {addingMember ? (
          <div className="rounded-xl p-2.5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <input value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder="Their name" className="w-full px-3 py-2 rounded-xl outline-none mb-2" style={{ border: `1px solid ${C.border}`, fontFamily: FONT_BODY, fontSize: 13 }} />
            <input value={memberPhone} onChange={(e) => setMemberPhone(e.target.value)} placeholder="Their phone number" className="w-full px-3 py-2 rounded-xl outline-none mb-2" style={{ border: `1px solid ${C.border}`, fontFamily: FONT_BODY, fontSize: 13 }} />
            <div className="flex flex-wrap gap-1.5 mb-2">
              {RELATION_OPTIONS.map((r) => (
                <button key={r} onClick={() => setMemberRelation(r)} className="px-2.5 py-1 rounded-full" style={{ fontFamily: FONT_BODY, fontSize: 10.5, background: memberRelation === r ? C.ink : "transparent", color: memberRelation === r ? "#fff" : C.inkSoft, border: `1px solid ${memberRelation === r ? C.ink : C.border}` }}>
                  {r}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAddingMember(false)} className="flex-1 py-2 rounded-xl" style={{ border: `1px solid ${C.border}`, color: C.inkSoft, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600 }}>Cancel</button>
              <button onClick={saveMember} className="flex-1 py-2 rounded-xl" style={{ background: C.ink, color: "#fff", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600 }}>Add</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddingMember(true)} className="w-full py-2 rounded-xl flex items-center justify-center gap-1.5" style={{ border: `1px solid ${C.accent}`, color: C.accentDark, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700 }}>
            <Plus size={13} /> Add household member
          </button>
        )}
      </div>
    </div>
  );
}

function PaywallScreen({ subscription, freeProjectsUsed, addressLocked, reason, onBack, onStartTrial }) {
  const [billing, setBilling] = useState("monthly");
  const limitReached = freeProjectsUsed >= FREE_PROJECT_LIMIT || addressLocked;
  const plansRef = useRef(null);
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 pt-5 pb-3">
        <button onClick={onBack}><ChevronLeft size={20} color={C.ink} /></button>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: C.ink }}>Plans</span>
      </div>
      <div className="px-5 flex-1 overflow-y-auto pb-4">
        {reason === "firstCompletion" && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: C.amberSoft, border: `1px solid ${C.amber}55` }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: C.amber, marginBottom: 4 }}>You have 1 free project left</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.amber, lineHeight: 1.4, marginBottom: 12 }}>
              That project's all wrapped up — nice. Whenever you're ready, here's how to keep taking care of your home with us.
            </div>
            <div className="flex gap-2 mb-2">
              <button onClick={() => plansRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} className="flex-1 py-2.5 rounded-xl" style={{ background: C.ink, color: "#fff", fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700 }}>
                Subscribe now
              </button>
              <button onClick={onBack} className="flex-1 py-2.5 rounded-xl" style={{ border: `1.5px solid ${C.amber}`, color: C.amber, fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700 }}>
                Remind me after the second job
              </button>
            </div>
            <div className="flex justify-center">
              <button onClick={onBack} style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint }}>
                Skip for now
              </button>
            </div>
          </div>
        )}
        {reason !== "firstCompletion" && subscription.status === "free" && (
          <div className="rounded-2xl p-3 mb-4" style={{ background: C.amberSoft, border: `1px solid ${C.amber}55` }}>
            <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13, color: C.amber }}>
              {limitReached ? "You've used your 2 free projects for this home" : `${FREE_PROJECT_LIMIT - freeProjectsUsed} free project${FREE_PROJECT_LIMIT - freeProjectsUsed !== 1 ? "s" : ""} left`}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: C.amber, marginTop: 2, lineHeight: 1.4 }}>
              Start a plan below and get {TRIAL_MONTHS} months free before anything's charged.
            </div>
          </div>
        )}
        {subscription.status === "trial" && (
          <div className="rounded-2xl p-3 mb-4" style={{ background: C.sageSoft, border: `1px solid ${C.sage}55` }}>
            <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13, color: C.sage }}>
              On your free trial · {SUBSCRIPTION_PLANS[subscription.plan].name}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: C.sage, marginTop: 2 }}>
              {subscription.trialMonthsLeft} month{subscription.trialMonthsLeft !== 1 ? "s" : ""} left before billing starts
            </div>
          </div>
        )}
        {subscription.status === "active" && (
          <div className="rounded-2xl p-3 mb-4" style={{ background: C.sageSoft, border: `1px solid ${C.sage}55` }}>
            <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13, color: C.sage }}>
              Active · {SUBSCRIPTION_PLANS[subscription.plan].name}
            </div>
          </div>
        )}

        <div className="flex gap-1.5 mb-4">
          {BILLING_CYCLES.map((c) => (
            <button key={c.id} onClick={() => setBilling(c.id)} className="flex-1 py-2 rounded-2xl" style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, background: billing === c.id ? C.ink : C.surface, color: billing === c.id ? "#fff" : C.inkSoft, border: `1px solid ${billing === c.id ? C.ink : C.border}` }}>
              {c.label}
            </button>
          ))}
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, textAlign: "center", marginBottom: 14 }}>
          {BILLING_CYCLES.find((c) => c.id === billing).note}
        </div>

        <div className="space-y-3" ref={plansRef}>
          <PlanCard planKey="plus" billing={billing} current={subscription} onStartTrial={onStartTrial} />
          <PlanCard planKey="premium" billing={billing} current={subscription} onStartTrial={onStartTrial} />
        </div>

        <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint, textAlign: "center", marginTop: 14, lineHeight: 1.4 }}>
          Cancel anytime during your trial and you won't be charged.
        </div>
      </div>
    </div>
  );
}

function PaymentScreen({ job, onPay }) {
  return (
    <div className="h-full flex flex-col px-5 pt-5">
      <span style={{ fontFamily: FONT_DISPLAY, fontSize: 19, color: C.ink }}>Payment</span>
      <div className="rounded-3xl p-4 mt-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5 }}>Job</div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: C.ink, marginTop: 4 }}>{job.title}</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}>{job.contractor}</div>
        <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.inkSoft }}>Total</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 20, color: C.ink, fontWeight: 500 }}>${job.estimate}</span>
        </div>
      </div>
      <div className="mt-6">
        <PrimaryButton onClick={onPay}><span className="flex items-center justify-center gap-2"><CreditCard size={15} /> Pay ${job.estimate} securely</span></PrimaryButton>
        <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, textAlign: "center", marginTop: 10 }}>Held until the work is confirmed complete</div>
        <div className="flex items-center justify-center gap-1.5 mt-3" style={{ color: C.sage }}>
          <ShieldCheck size={13} />
          <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600 }}>This is the total you agreed to — no surprise fees added after the fact.</span>
        </div>
      </div>
    </div>
  );
}

function ReceiptScreen({ job, onDone }) {
  const [rating, setRating] = useState(0);
  const [tipPct, setTipPct] = useState(0);
  const tipAmount = Math.round(job.estimate * (tipPct / 100) * 100) / 100;
  const totalWithTip = job.estimate + tipAmount;
  return (
    <div className="h-full flex flex-col items-center px-6 pt-10">
      <div style={{ width: 56, height: 56, borderRadius: 999, background: C.sageSoft, display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={28} color={C.sage} /></div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: C.ink, marginTop: 14 }}>Paid</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.inkSoft, marginTop: 4, textAlign: "center" }}>${job.estimate} sent to {job.contractor}</div>
      {job.beforePhoto && job.afterPhoto && (
        <div className="grid grid-cols-2 gap-2 w-full mt-6">
          <img src={job.beforePhoto} alt="before" style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 12 }} />
          <img src={job.afterPhoto} alt="after" style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 12 }} />
        </div>
      )}
      <div className="mt-6 w-full">
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.inkFaint, textAlign: "center", marginBottom: 8 }}>Add a tip? (optional)</div>
        <div className="flex gap-1.5">
          {TIP_OPTIONS.map((pct) => (
            <button key={pct} onClick={() => setTipPct(pct)} className="flex-1 py-2 rounded-2xl" style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, background: tipPct === pct ? C.ink : C.surface, color: tipPct === pct ? "#fff" : C.inkSoft, border: `1px solid ${tipPct === pct ? C.ink : C.border}` }}>
              {pct === 0 ? "No tip" : `${pct}%`}
            </button>
          ))}
        </div>
        {tipPct > 0 && (
          <div className="flex items-center justify-between mt-2 px-1" style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.inkSoft }}>
            <span>Tip (${tipAmount.toFixed(2)}) + subtotal</span>
            <span style={{ fontFamily: FONT_MONO, fontWeight: 700, color: C.ink }}>${totalWithTip.toFixed(2)}</span>
          </div>
        )}
      </div>
      <div className="mt-6 w-full">
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.inkFaint, textAlign: "center", marginBottom: 8 }}>Rate your pro</div>
        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (<button key={n} onClick={() => setRating(n)}><Star size={22} fill={n <= rating ? C.accent : "none"} color={C.accent} /></button>))}
        </div>
      </div>
      <div className="mt-10 w-full"><PrimaryButton onClick={onDone}>Done</PrimaryButton></div>
    </div>
  );
}

/* ---------------------------------- PROFILE TAB ---------------------------------- */
function SupportChatBot() {
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! I can answer common questions about using HomeAi. What do you need help with?" },
  ]);
  const [input, setInput] = useState("");

  function send() {
    if (!input.trim()) return;
    const question = input.trim();
    const match = matchFaq(question);
    setMessages((prev) => [
      ...prev,
      { role: "user", text: question },
      match ? { role: "bot", text: match.a } : { role: "bot", text: "I don't have a canned answer for that one — tap Email support below and a real person will get back to you." },
    ]);
    setInput("");
  }

  return (
    <div className="rounded-2xl overflow-hidden mb-2" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <div className="p-3 max-h-64 overflow-y-auto space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="rounded-2xl px-3 py-2"
              style={{ maxWidth: 220, background: m.role === "user" ? C.ink : C.bg, color: m.role === "user" ? "#fff" : C.ink, fontFamily: FONT_BODY, fontSize: 12, lineHeight: 1.4 }}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="px-3 pb-2">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {FAQ_ENTRIES.slice(0, 3).map((f) => (
            <button key={f.q} onClick={() => setInput(f.q)} className="px-2.5 py-1 rounded-full" style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.accentDark, border: `1px solid ${C.accent}` }}>
              {f.q}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-xl px-2.5 py-1.5" style={{ border: `1px solid ${C.border}`, background: C.bg }}>
          <MessageCircle size={14} color={C.inkFaint} />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask a question…"
            className="flex-1 bg-transparent outline-none"
            style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.ink }}
          />
          <button onClick={send}><Send size={14} color={C.accent} /></button>
        </div>
      </div>
      <a href="mailto:support@homeai.app" className="w-full py-2.5 flex items-center justify-center" style={{ background: C.ink, color: "#fff", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600 }}>
        Email a real person instead
      </a>
    </div>
  );
}

function ProfileTab({ ownerName, ownerPhoto, onOpenEditProfile, onSetOwnerName, assets, addAsset, editAsset, deleteAsset, nudges, onToggleNudge, onSetNudgeFreq, onSetNudgeDay, onAddNudge, onDeleteNudge, onScheduleRecurring, properties, activeHomeId, onSelectHome, onAddProperty, jobs, onRequestAgain, onLogout, tasks, onToggleTask, onSetTaskTimeline, onAddTask, onDeleteTask, onPreviewOnboarding, onViewContractor, subscription, freeProjectsUsed, onOpenPaywall, household, onAddHousehold, onDeleteHousehold, textScale, onSetTextScale, referralCredit, onAddReferralCredit, onOpenPassport, deepLinkTarget, onDeepLinkConsumed }) {
  const [adding, setAdding] = useState(false);
  const [cat, setCat] = useState(ASSET_CATEGORIES[0]);
  const [label, setLabel] = useState("");
  const [addingProperty, setAddingProperty] = useState(false);
  const [propNickname, setPropNickname] = useState("");
  const [propAddress, setPropAddress] = useState("");
  const [propUnit, setPropUnit] = useState("");
  const [propPostal, setPropPostal] = useState("");
  const [expandedSetting, setExpandedSetting] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([{ brand: "Visa", last4: "4242", exp: "08/28" }]);
  const [addingCard, setAddingCard] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [notifPrefs, setNotifPrefs] = useState({ jobUpdates: true, newQuotes: true, maintenanceReminders: true });
  const [seasonalOpen, setSeasonalOpen] = useState(false);
  const [nudgesOpen, setNudgesOpen] = useState(false);
  const [season, setSeason] = useState(currentSeason());
  const [openTaskId, setOpenTaskId] = useState(null);
  const [openNudgeId, setOpenNudgeId] = useState(null);
  const [addingTask, setAddingTask] = useState(false);
  const [customTaskLabel, setCustomTaskLabel] = useState("");
  const [customTaskTimeline, setCustomTaskTimeline] = useState(TIMELINE_OPTIONS[3]);
  const [contractorsOpen, setContractorsOpen] = useState(false);
  const [openHistoryId, setOpenHistoryId] = useState(null);
  const [homeOpen, setHomeOpen] = useState(false);
  const [photosOpen, setPhotosOpen] = useState(false);
  const referralCode = `${(ownerName || "HOME").split(" ")[0].toUpperCase().slice(0, 8)}${activeHomeId}`;
  const [language, setLanguage] = useState(LANGUAGE_OPTIONS[0]);
  const [addingNudge, setAddingNudge] = useState(false);
  const [schedulingNudgeId, setSchedulingNudgeId] = useState(null);
  const [customNudgeLabel, setCustomNudgeLabel] = useState("");
  const [customNudgeFreq, setCustomNudgeFreq] = useState(FREQ_OPTIONS[2]);
  const [customNudgeDay, setCustomNudgeDay] = useState(DAYS_OF_WEEK[1]);
  const [scanning, setScanning] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [editCat, setEditCat] = useState(ASSET_CATEGORIES[0]);
  const [editInstalled, setEditInstalled] = useState("");
  const scanFileRef = useRef(null);
  const receiptFileRef = useRef(null);
  const seasonalRef = useRef(null);
  const nudgesRef = useRef(null);
  const contractorsRef = useRef(null);
  const homeRef = useRef(null);
  const photosRef = useRef(null);
  const paymentRef = useRef(null);
  const receiptsRef = useRef(null);
  const pushnotifsRef = useRef(null);
  const textsizeRef = useRef(null);
  const languageRef = useRef(null);
  const supportRef = useRef(null);
  const referralRowRef = useRef(null);
  const propertiesRef = useRef(null);

  useEffect(() => {
    if (!deepLinkTarget) return;
    const refMap = {
      seasonal: seasonalRef, nudges: nudgesRef, contractors: contractorsRef, yourHome: homeRef, photos: photosRef,
      payment: paymentRef, receipts: receiptsRef, pushnotifs: pushnotifsRef, textsize: textsizeRef, language: languageRef, support: supportRef, referral: referralRowRef,
      properties: propertiesRef,
    };
    if (deepLinkTarget === "seasonal") setSeasonalOpen(true);
    else if (deepLinkTarget === "nudges") setNudgesOpen(true);
    else if (deepLinkTarget === "contractors") setContractorsOpen(true);
    else if (deepLinkTarget === "yourHome") setHomeOpen(true);
    else if (deepLinkTarget === "photos") setPhotosOpen(true);
    else if (deepLinkTarget === "textsize") setExpandedSetting("textsize");
    else if (deepLinkTarget === "language") setExpandedSetting("language");
    else if (deepLinkTarget === "receipts") setExpandedSetting("receipts");
    else if (deepLinkTarget === "payment") setExpandedSetting("payment");
    else if (deepLinkTarget === "pushnotifs") setExpandedSetting("notifications");
    else if (deepLinkTarget === "support") setExpandedSetting("support");
    else if (deepLinkTarget === "referral") setExpandedSetting("referral");
    const target = refMap[deepLinkTarget];
    setTimeout(() => {
      target?.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
    onDeepLinkConsumed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkTarget]);

  function handleReceiptFile(e, assetId) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    editAsset(assetId, { receiptPhoto: url });
    e.target.value = "";
  }

  function startEditAsset(a) {
    setEditingId(a.id);
    setEditLabel(a.label);
    setEditCat(a.category);
    setEditInstalled(a.installed === "—" ? "" : a.installed);
  }
  function saveEditAsset() {
    editAsset(editingId, { label: editLabel.trim() || "Item", category: editCat, installed: editInstalled.trim() || "—" });
    setEditingId(null);
  }
  function deleteEditAsset() {
    deleteAsset(editingId);
    setEditingId(null);
  }
  function handleScanFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setScanning(true);
    setTimeout(() => {
      const guess = SCAN_GUESSES[Math.floor(Math.random() * SCAN_GUESSES.length)];
      const year = 2014 + Math.floor(Math.random() * 10);
      addAsset({ id: Date.now(), category: guess.category, label: guess.label, installed: String(year), warranty: String(year + 10), photoUrl: url });
      setScanning(false);
    }, 1500);
    e.target.value = "";
  }

  function saveCustomNudge() {
    if (!customNudgeLabel.trim()) return;
    onAddNudge(customNudgeLabel.trim(), customNudgeFreq, customNudgeDay);
    setCustomNudgeLabel("");
    setCustomNudgeFreq(FREQ_OPTIONS[2]);
    setCustomNudgeDay(DAYS_OF_WEEK[1]);
    setAddingNudge(false);
  }

  function saveCustomTask() {
    if (!customTaskLabel.trim()) return;
    onAddTask(season, customTaskLabel.trim(), customTaskTimeline);
    setCustomTaskLabel("");
    setCustomTaskTimeline(TIMELINE_OPTIONS[3]);
    setAddingTask(false);
  }

  function detectCardBrand(num) {
    if (num.startsWith("4")) return "Visa";
    if (num.startsWith("5")) return "Mastercard";
    if (num.startsWith("3")) return "Amex";
    if (num.startsWith("6")) return "Discover";
    return "Card";
  }

  function saveCard() {
    const digits = cardNumber.replace(/\D/g, "");
    if (digits.length < 4 || !cardExp.trim()) return;
    setPaymentMethods((prev) => [...prev, { brand: detectCardBrand(digits), last4: digits.slice(-4), exp: cardExp.trim() }]);
    setCardNumber("");
    setCardExp("");
    setAddingCard(false);
  }

  function removeCard(index) {
    setPaymentMethods((prev) => prev.filter((_, i) => i !== index));
  }

  const activeProperty = properties.find((p) => p.id === activeHomeId) || properties[0];

  const allPhotos = [];
  const allReceipts = [];
  (assets || []).forEach((a) => {
    if (a.photoUrl) allPhotos.push({ url: a.photoUrl, label: a.label });
    if (a.receiptPhoto) allReceipts.push({ url: a.receiptPhoto, label: a.label });
  });
  (jobs || []).filter((j) => j.homeId === activeHomeId).forEach((j) => {
    if (j.beforePhoto) allPhotos.push({ url: j.beforePhoto, label: `${j.title} — before` });
    if (j.afterPhoto) allPhotos.push({ url: j.afterPhoto, label: `${j.title} — after` });
    if (j.receiptPhoto) allReceipts.push({ url: j.receiptPhoto, label: j.title });
  });

  const pastContractors = [];
  const seenNames = new Set();
  for (const j of jobs || []) {
    if (j.status !== "Completed" || j.type !== "job" || !j.contractor || seenNames.has(j.contractor)) continue;
    seenNames.add(j.contractor);
    const record = findContractorRecord(j.trade, j.contractor);
    const history = (jobs || [])
      .filter((h) => h.contractor === j.contractor && h.status === "Completed" && h.type === "job")
      .map((h) => ({ title: h.title, date: h.slot, price: h.estimate }));
    pastContractors.push({
      name: j.contractor,
      trade: j.trade || "General",
      lastJob: j.title,
      lastDate: j.slot,
      phone: record?.phone || null,
      rating: record?.rating,
      source: record?.source || "google",
      history,
    });
  }

  function save() {
    if (!label.trim()) return;
    addAsset({ id: Date.now(), category: cat, label: label.trim(), installed: "—", warranty: "—" });
    setLabel("");
    setAdding(false);
  }

  function saveProperty() {
    if (!propNickname.trim() || !propAddress.trim()) return;
    onAddProperty(propNickname.trim(), propAddress.trim(), propUnit.trim(), propPostal.trim());
    setPropNickname("");
    setPropAddress("");
    setPropUnit("");
    setPropPostal("");
    setAddingProperty(false);
  }

  const seasonTasks = (tasks || []).filter((t) => t.season === season);
  const doneCount = seasonTasks.filter((t) => t.done).length;

  return (
    <div className="h-full overflow-y-auto px-5 pt-5 pb-4">
      <button onClick={onOpenEditProfile} className="w-full flex items-center gap-3">
        <div className="flex items-center justify-center flex-shrink-0" style={{ width: 44, height: 44, borderRadius: 999, background: C.accentSoft, overflow: "hidden" }}>
          {ownerPhoto ? <img src={ownerPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={20} color={C.accentDark} />}
        </div>
        <div className="flex-1 text-left">
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: C.ink }}>{ownerName}</div>
          <div className="flex items-center gap-1" style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: C.inkFaint }}><MapPin size={11} /> {properties.length} propert{properties.length !== 1 ? "ies" : "y"}</div>
        </div>
        <ChevronRight size={16} color={C.inkFaint} />
      </button>

      <div className="flex items-center justify-between mt-6 mb-2" ref={propertiesRef}>
        <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5 }}>Properties</span>
        <button onClick={() => setAddingProperty((v) => !v)} className="flex items-center gap-1" style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.accentDark, fontWeight: 600 }}>
          {addingProperty ? <X size={13} /> : <Plus size={13} />} {addingProperty ? "Cancel" : "Add property"}
        </button>
      </div>

      {addingProperty && (
        <div className="rounded-2xl p-3 mb-2" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <input value={propNickname} onChange={(e) => setPropNickname(e.target.value)} placeholder="Nickname, e.g. Rental Condo" className="w-full px-3 py-2 rounded-xl outline-none mb-2" style={{ border: `1px solid ${C.border}`, fontFamily: FONT_BODY, fontSize: 12.5 }} />
          <input value={propAddress} onChange={(e) => setPropAddress(e.target.value)} placeholder="Address" className="w-full px-3 py-2 rounded-xl outline-none mb-2" style={{ border: `1px solid ${C.border}`, fontFamily: FONT_BODY, fontSize: 12.5 }} />
          <div className="flex gap-2">
            <input value={propUnit} onChange={(e) => setPropUnit(e.target.value)} placeholder="Unit # (if any)" className="flex-1 px-3 py-2 rounded-xl outline-none" style={{ border: `1px solid ${C.border}`, fontFamily: FONT_BODY, fontSize: 12.5 }} />
            <input value={propPostal} onChange={(e) => setPropPostal(e.target.value)} placeholder="Postal code" className="flex-1 px-3 py-2 rounded-xl outline-none" style={{ border: `1px solid ${C.border}`, fontFamily: FONT_BODY, fontSize: 12.5 }} />
          </div>
          <div className="mt-2"><PrimaryButton onClick={saveProperty}>Save property</PrimaryButton></div>
        </div>
      )}

      <div className="space-y-2 mb-6">
        {properties.map((p) => {
          const active = p.id === activeHomeId;
          return (
            <button key={p.id} onClick={() => onSelectHome(p.id)} className="w-full text-left rounded-2xl p-3 flex items-center gap-3" style={{ background: active ? C.accentSoft : C.surface, border: `1px solid ${active ? C.accent : C.border}` }}>
              <div className="flex items-center justify-center flex-shrink-0" style={{ width: 34, height: 34, borderRadius: 999, background: active ? C.accent : C.bg }}>
                <Building2 size={15} color={active ? "#fff" : C.inkFaint} />
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13, color: C.ink }}>{p.nickname}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, marginTop: 1 }}>{p.address}</div>
              </div>
              {active && <span style={{ fontFamily: FONT_MONO, fontSize: 9.5, color: C.accentDark, fontWeight: 600, textTransform: "uppercase" }}>Active</span>}
            </button>
          );
        })}
      </div>

      <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, marginTop: -12, marginBottom: 12 }}>Home health, checklist, nudges, and history below are all for <strong style={{ color: C.inkSoft }}>{activeProperty.nickname}</strong>.</div>

      <div className="rounded-3xl p-4 flex items-center gap-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-center flex-shrink-0" style={{ width: 60, height: 60, borderRadius: 999, background: `conic-gradient(${C.sage} ${HOME_SCORE * 3.6}deg, ${C.border} 0deg)` }}>
          <div className="flex items-center justify-center" style={{ width: 47, height: 47, borderRadius: 999, background: C.surface }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 15, color: C.ink, fontWeight: 500 }}>{HOME_SCORE}</span>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: C.ink }}>Home health</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: C.inkFaint, marginTop: 2, lineHeight: 1.4 }}>Based on your home's age, upkeep, and open issues</div>
        </div>
      </div>

      <div className="rounded-3xl p-4 mt-2 flex items-center justify-between" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5 }}>Estimated yearly upkeep</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, marginTop: 2, lineHeight: 1.4 }}>Based on your home's age and tracked systems</div>
        </div>
        <span style={{ fontFamily: FONT_MONO, fontSize: 18, color: C.ink, fontWeight: 700, flexShrink: 0 }}>${400 + assets.length * 150}</span>
      </div>

      <div className="mt-5" ref={seasonalRef}>
        <SectionHeader title={`${season} checklist`} meta={`${doneCount}/${seasonTasks.length}`} open={seasonalOpen} onToggle={() => setSeasonalOpen((v) => !v)} />
        {seasonalOpen && (
          <div className="mt-2">
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.inkSoft, marginBottom: 10, lineHeight: 1.4 }}>
              These are some of the checklist items other homeowners are using this season. Suggested timing is included for each — tap to change it.
            </div>
            {doneCount < seasonTasks.length && (
              <div className="flex items-center gap-1.5 mb-2" style={{ color: C.sage }}>
                <CheckCircle2 size={11} />
                <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600 }}>Finishing this list would raise your Home Health Score by up to {(seasonTasks.length - doneCount) * 1} pts.</span>
              </div>
            )}
            <div className="flex gap-1.5 mb-3">
              {SEASON_LIST.map((s) => (
                <button key={s} onClick={() => setSeason(s)} className="flex-1 py-1.5 rounded-full" style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 700, background: season === s ? C.ink : C.surface, color: season === s ? "#fff" : C.inkSoft, border: `1px solid ${season === s ? C.ink : C.border}` }}>
                  {s}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              {seasonTasks.map((t) => {
                const urgency = taskUrgencyStyle(t, season);
                return (
                  <div key={t.id} className="rounded-2xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${openTaskId === t.id ? C.accent : C.border}` }}>
                    <button onClick={() => setOpenTaskId(openTaskId === t.id ? null : t.id)} className="w-full flex items-center gap-2.5 p-2.5 text-left">
                      <div onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => onToggleTask(t.id)} className="flex items-center justify-center flex-shrink-0" style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${t.done ? C.sage : C.inkFaint}`, background: t.done ? C.sage : "transparent" }}>
                          {t.done && <CheckCircle2 size={12} color="#fff" />}
                        </button>
                      </div>
                      <span className="flex-1" style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.ink }}>{t.label}</span>
                      <div className="flex items-center gap-1 flex-shrink-0 px-2 py-1 rounded-full" style={{ background: urgency.bg }}>
                        <span style={{ fontFamily: FONT_MONO, fontSize: 9.5, color: urgency.fg, fontWeight: 700 }}>{t.timeline}</span>
                        <ChevronDown size={11} color={urgency.fg} style={{ transform: openTaskId === t.id ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                      </div>
                    </button>
                    {openTaskId === t.id && (
                      <div className="px-2.5 pb-2.5">
                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                          {TIMELINE_OPTIONS.map((opt) => (
                            <button
                              key={opt}
                              onClick={() => onSetTaskTimeline(t.id, opt)}
                              className="px-2.5 py-1 rounded-full"
                              style={{ fontFamily: FONT_BODY, fontSize: 10.5, background: t.timeline === opt ? C.ink : "transparent", color: t.timeline === opt ? "#fff" : C.inkSoft, border: `1px solid ${t.timeline === opt ? C.ink : C.border}` }}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => onRequestAgain(`I need help with: ${t.label}`)}
                            className="flex-1 py-2 rounded-xl"
                            style={{ background: C.accentSoft, color: C.accentDark, fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 600 }}
                          >
                            Find a pro for this
                          </button>
                          <button onClick={() => onDeleteTask(t.id)} className="flex items-center justify-center px-3 rounded-xl" style={{ border: `1px solid ${C.brick}` }}>
                            <Trash2 size={13} color={C.brick} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {addingTask ? (
                <div className="rounded-2xl p-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <input
                    value={customTaskLabel}
                    onChange={(e) => setCustomTaskLabel(e.target.value)}
                    placeholder="e.g. Clean the BBQ"
                    className="w-full px-3 py-2 rounded-xl outline-none mb-2"
                    style={{ border: `1px solid ${C.border}`, fontFamily: FONT_BODY, fontSize: 13 }}
                  />
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkSoft, fontWeight: 600, marginBottom: 5 }}>When</div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {TIMELINE_OPTIONS.map((opt) => (
                      <button key={opt} onClick={() => setCustomTaskTimeline(opt)} className="px-2.5 py-1 rounded-full" style={{ fontFamily: FONT_BODY, fontSize: 10.5, background: customTaskTimeline === opt ? C.ink : "transparent", color: customTaskTimeline === opt ? "#fff" : C.inkSoft, border: `1px solid ${customTaskTimeline === opt ? C.ink : C.border}` }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setAddingTask(false)} className="flex-1 py-2 rounded-xl" style={{ border: `1px solid ${C.border}`, color: C.inkSoft, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600 }}>Cancel</button>
                    <button onClick={saveCustomTask} className="flex-1 py-2 rounded-xl" style={{ background: C.ink, color: "#fff", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600 }}>Save item</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingTask(true)} className="w-full py-2.5 rounded-2xl flex items-center justify-center gap-1.5" style={{ border: `1.5px solid ${C.accent}`, color: C.accentDark, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700 }}>
                  <Plus size={14} /> Add to {season.toLowerCase()} checklist
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3" ref={nudgesRef}>
        <SectionHeader
          title="Recurring nudges"
          subtitle="Chores HomeAi will remind you about on a schedule"
          meta={`${(nudges || []).filter((n) => n.enabled).length} active`}
          open={nudgesOpen}
          onToggle={() => setNudgesOpen((v) => !v)}
        />
        {nudgesOpen && (
          <div className="mt-2">
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.inkSoft, marginBottom: 10, lineHeight: 1.4 }}>
              These are some of the recurring nudges other homeowners have set up. Tap a schedule to adjust it to your own.
            </div>
            <div className="space-y-1.5">
              {(nudges || []).map((n) => (
                <div key={n.id} className="rounded-2xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${openNudgeId === n.id ? C.accent : C.border}` }}>
                  <button onClick={() => setOpenNudgeId(openNudgeId === n.id ? null : n.id)} className="w-full p-3 flex items-center gap-3 text-left">
                    <div className="flex items-center justify-center flex-shrink-0" style={{ width: 30, height: 30, borderRadius: 999, background: C.accentSoft }}>
                      <n.icon size={14} color={C.accentDark} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13, color: C.ink }}>{n.label}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.accentDark, fontWeight: 700 }}>{n.freq} · {n.day}</span>
                        <ChevronDown size={12} color={C.accentDark} style={{ transform: openNudgeId === n.id ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <ToggleSwitch on={n.enabled} onClick={() => onToggleNudge(n.id)} />
                    </div>
                  </button>
                  {openNudgeId === n.id && (
                    <div className="px-3 pb-3">
                      <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>How often</div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {FREQ_OPTIONS.map((f) => (
                          <button
                            key={f}
                            onClick={() => onSetNudgeFreq(n.id, f)}
                            className="px-2.5 py-1 rounded-full"
                            style={{ fontFamily: FONT_BODY, fontSize: 10.5, background: n.freq === f ? C.ink : "transparent", color: n.freq === f ? "#fff" : C.inkSoft, border: `1px solid ${n.freq === f ? C.ink : C.border}` }}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>What day</div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {DAYS_OF_WEEK.map((d) => (
                          <button
                            key={d}
                            onClick={() => onSetNudgeDay(n.id, d)}
                            className="px-2.5 py-1 rounded-full"
                            style={{ fontFamily: FONT_BODY, fontSize: 10.5, background: n.day === d ? C.ink : "transparent", color: n.day === d ? "#fff" : C.inkSoft, border: `1px solid ${n.day === d ? C.ink : C.border}` }}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => setSchedulingNudgeId(schedulingNudgeId === n.id ? null : n.id)} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl mb-2" style={{ background: C.accentSoft, color: C.accentDark, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700 }}>
                        <Wrench size={13} /> Schedule a contractor
                      </button>
                      {schedulingNudgeId === n.id && (
                        <div className="mb-2 space-y-1.5">
                          {(CONTRACTORS[n.trade] || CONTRACTORS.Handyman).map((c) => (
                            <button
                              key={c.name}
                              onClick={() => {
                                onScheduleRecurring(n, c.name);
                                setSchedulingNudgeId(null);
                              }}
                              className="w-full text-left rounded-xl p-2.5 flex items-center justify-between"
                              style={{ border: `1px solid ${C.border}`, background: C.bg }}
                            >
                              <div className="min-w-0">
                                <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12.5, color: C.ink }}>{c.name}</div>
                                <ReputationLine c={c} />
                              </div>
                              <ChevronRight size={14} color={C.inkFaint} style={{ flexShrink: 0 }} />
                            </button>
                          ))}
                          <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.inkFaint, lineHeight: 1.4 }}>
                            Sets this up as an ongoing service — find it later under Projects → Recurring.
                          </div>
                        </div>
                      )}
                      <button onClick={() => onDeleteNudge(n.id)} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl" style={{ border: `1px solid ${C.brick}`, color: C.brick, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600 }}>
                        <Trash2 size={13} /> Remove this nudge
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {addingNudge ? (
                <div className="rounded-2xl p-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <input
                    value={customNudgeLabel}
                    onChange={(e) => setCustomNudgeLabel(e.target.value)}
                    placeholder="e.g. Deck sealing"
                    className="w-full px-3 py-2 rounded-xl outline-none mb-2"
                    style={{ border: `1px solid ${C.border}`, fontFamily: FONT_BODY, fontSize: 13 }}
                  />
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkSoft, fontWeight: 600, marginBottom: 5 }}>How often</div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {FREQ_OPTIONS.map((f) => (
                      <button key={f} onClick={() => setCustomNudgeFreq(f)} className="px-2.5 py-1 rounded-full" style={{ fontFamily: FONT_BODY, fontSize: 10.5, background: customNudgeFreq === f ? C.ink : "transparent", color: customNudgeFreq === f ? "#fff" : C.inkSoft, border: `1px solid ${customNudgeFreq === f ? C.ink : C.border}` }}>
                        {f}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkSoft, fontWeight: 600, marginBottom: 5 }}>What day</div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {DAYS_OF_WEEK.map((d) => (
                      <button key={d} onClick={() => setCustomNudgeDay(d)} className="px-2.5 py-1 rounded-full" style={{ fontFamily: FONT_BODY, fontSize: 10.5, background: customNudgeDay === d ? C.ink : "transparent", color: customNudgeDay === d ? "#fff" : C.inkSoft, border: `1px solid ${customNudgeDay === d ? C.ink : C.border}` }}>
                        {d}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setAddingNudge(false)} className="flex-1 py-2 rounded-xl" style={{ border: `1px solid ${C.border}`, color: C.inkSoft, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600 }}>Cancel</button>
                    <button onClick={saveCustomNudge} className="flex-1 py-2 rounded-xl" style={{ background: C.ink, color: "#fff", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600 }}>Save nudge</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingNudge(true)} className="w-full py-2.5 rounded-2xl flex items-center justify-center gap-1.5" style={{ border: `1.5px solid ${C.accent}`, color: C.accentDark, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700 }}>
                  <Plus size={14} /> Add a nudge
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3" ref={contractorsRef}>
        <SectionHeader
          title="Past contractors"
          subtitle="Pros you've worked with — reach out again in one tap"
          meta={`${pastContractors.length}`}
          open={contractorsOpen}
          onToggle={() => setContractorsOpen((v) => !v)}
        />
        {contractorsOpen && (
          pastContractors.length === 0 ? (
            <div className="rounded-2xl p-3 mt-2" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.inkSoft }}>No completed projects yet — contractors you've hired will show up here.</div>
            </div>
          ) : (
            <div className="space-y-1.5 mt-2">
              {pastContractors.map((c) => (
                <div key={c.name} className="rounded-2xl p-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <button onClick={() => onViewContractor(c.name, c.trade, { lastJob: c.lastJob, lastDate: c.lastDate })} className="w-full flex items-start gap-3 text-left">
                    <div className="flex items-center justify-center flex-shrink-0" style={{ width: 34, height: 34, borderRadius: 999, background: C.accentSoft }}>
                      <User size={15} color={C.accentDark} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13.5, color: C.ink }}>{c.name}</span>
                        {c.source === "homeai" && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full" style={{ background: C.sageSoft, color: C.sage, fontFamily: FONT_MONO, fontSize: 8.5, fontWeight: 600 }}>
                            <CheckCircle2 size={8} /> On HomeAi
                          </span>
                        )}
                      </div>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.inkSoft, marginTop: 1 }}>{c.trade} · last hired for "{c.lastJob}" · {c.lastDate}</div>
                    </div>
                    <ChevronRight size={14} color={C.inkFaint} style={{ marginTop: 8 }} />
                  </button>
                  <div className="flex gap-2 mt-2.5">
                    {c.phone ? (
                      <a href={`tel:${c.phone}`} onClick={(e) => e.stopPropagation()} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl" style={{ background: C.ink, color: "#fff", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600 }}>
                        <PhoneCall size={12} /> Call
                      </a>
                    ) : (
                      <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl" disabled style={{ background: C.bg, color: C.inkFaint, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, border: `1px solid ${C.border}` }}>
                        <PhoneCall size={12} /> Call
                      </button>
                    )}
                    <button onClick={() => onRequestAgain(`I need ${c.trade.toLowerCase()} work done again, same as before with ${c.name}`)} className="flex-1 py-2 rounded-xl" style={{ background: "transparent", color: C.accentDark, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, border: `1px solid ${C.accent}` }}>
                      Request again
                    </button>
                    <button disabled className="flex-1 py-2 rounded-xl" style={{ background: "transparent", color: C.inkFaint, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, border: `1px solid ${C.border}` }} title="Coming in v2: message contractors directly in the app">
                      Message
                    </button>
                  </div>

                  {c.history.length > 0 && (
                    <div className="mt-2.5 pt-2.5" style={{ borderTop: `1px solid ${C.border}` }}>
                      <button onClick={() => setOpenHistoryId(openHistoryId === c.name ? null : c.name)} className="w-full flex items-center justify-between">
                        <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: C.accentDark, fontWeight: 700 }}>
                          Previous quotes ({c.history.length})
                        </span>
                        <ChevronDown size={13} color={C.accentDark} style={{ transform: openHistoryId === c.name ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                      </button>
                      {openHistoryId === c.name && (
                        <div className="mt-2 space-y-1.5">
                          {c.history.map((h, i) => (
                            <div key={i} className="flex items-center justify-between rounded-xl p-2" style={{ background: C.bg }}>
                              <div className="min-w-0">
                                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.ink, fontWeight: 600 }}>{h.title}</div>
                                <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint }}>{h.date}</div>
                              </div>
                              <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.ink, fontWeight: 700, flexShrink: 0 }}>{h.price === 0 ? "Free" : `$${h.price}`}</span>
                            </div>
                          ))}
                          <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.inkFaint, marginTop: 2, lineHeight: 1.4 }}>
                            What you paid last time — handy context if you're reaching out about the same kind of issue again.
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <div className="mt-3" ref={homeRef}>
        <SectionHeader
          title="Your home"
          subtitle="Roof, HVAC, water heater, appliances & warranties"
          meta={`${assets.length}`}
          open={homeOpen}
          onToggle={() => setHomeOpen((v) => !v)}
        />
        {homeOpen && (
          <div className="mt-2">
            {scanning && (
              <div className="rounded-2xl p-3 mb-2 flex items-center gap-3" style={{ background: C.accentSoft, border: `1px solid ${C.accent}55` }}>
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span key={i} style={{ width: 5, height: 5, borderRadius: 999, background: C.accentDark, animation: `homeaiBounce 1s ${i * 0.15}s infinite ease-in-out` }} />
                  ))}
                </div>
                <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.accentDark, fontWeight: 600 }}>Reading your photo…</span>
              </div>
            )}

            <button onClick={() => scanFileRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl mb-2" style={{ background: C.ink, color: "#fff", fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 700 }}>
              <Camera size={16} /> Scan an item
            </button>
            <input ref={scanFileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScanFile} />
            <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: C.inkSoft, textAlign: "center", marginBottom: 10, lineHeight: 1.4 }}>
              Take a photo of the item or its label — we'll add it for you. No typing needed.
            </div>

            {!adding && (
              <button onClick={() => setAdding(true)} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl mb-3" style={{ border: `1.5px solid ${C.border}`, color: C.ink, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700 }}>
                <Plus size={14} /> Add manually
              </button>
            )}
            {adding && (
              <div className="rounded-2xl p-3 mb-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {ASSET_CATEGORIES.map((c) => (
                    <button key={c} onClick={() => setCat(c)} className="px-2.5 py-1 rounded-full" style={{ fontFamily: FONT_BODY, fontSize: 11, background: cat === c ? C.ink : "transparent", color: cat === c ? "#fff" : C.inkSoft, border: `1px solid ${cat === c ? C.ink : C.border}` }}>{c}</button>
                  ))}
                </div>
                <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Kitchen refrigerator" className="w-full px-3 py-2 rounded-xl outline-none" style={{ border: `1px solid ${C.border}`, fontFamily: FONT_BODY, fontSize: 13 }} />
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setAdding(false)} className="flex-1 py-2 rounded-xl" style={{ border: `1px solid ${C.border}`, color: C.inkSoft, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600 }}>Cancel</button>
                  <button onClick={save} className="flex-1 py-2 rounded-xl" style={{ background: C.ink, color: "#fff", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600 }}>Save</button>
                </div>
              </div>
            )}

            {assets.length === 0 ? (
              <div className="rounded-2xl p-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.inkSoft, lineHeight: 1.4 }}>Nothing added yet for {activeProperty.nickname} — scan or add your roof, HVAC, water heater, or appliances so future diagnoses can use their age and warranty info.</div>
              </div>
            ) : (
              <div className="space-y-2">
                {assets.map((a) => (
                  <div key={a.id} className="rounded-2xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${editingId === a.id ? C.accent : C.border}` }}>
                    <button onClick={() => (editingId === a.id ? setEditingId(null) : startEditAsset(a))} className="w-full p-3 flex items-center gap-3 text-left">
                      {a.photoUrl ? (
                        <img src={a.photoUrl} alt="" style={{ width: 38, height: 38, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                      ) : (
                        <div className="flex items-center justify-center flex-shrink-0" style={{ width: 38, height: 38, borderRadius: 10, background: C.accentSoft }}>
                          <Wrench size={15} color={C.accentDark} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13.5, color: C.ink }}>{a.label}</span>
                          {a.receiptPhoto && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full" style={{ background: C.sageSoft, color: C.sage, fontFamily: FONT_MONO, fontSize: 8.5, fontWeight: 600 }}>
                              <Receipt size={8} /> Receipt on file
                            </span>
                          )}
                        </div>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.inkSoft, marginTop: 2 }}>
                          {a.category} · Installed {a.installed}{a.warranty && a.warranty !== "—" ? ` · Warranty until ${a.warranty}` : ""}
                        </div>
                      </div>
                      <ChevronDown size={16} color={C.inkFaint} style={{ transform: editingId === a.id ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }} />
                    </button>
                    {editingId === a.id && (
                      <div className="px-3 pb-3">
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {ASSET_CATEGORIES.map((c) => (
                            <button key={c} onClick={() => setEditCat(c)} className="px-2.5 py-1 rounded-full" style={{ fontFamily: FONT_BODY, fontSize: 11, background: editCat === c ? C.ink : "transparent", color: editCat === c ? "#fff" : C.inkSoft, border: `1px solid ${editCat === c ? C.ink : C.border}` }}>{c}</button>
                          ))}
                        </div>
                        <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} placeholder="Item name" className="w-full px-3 py-2 rounded-xl outline-none mb-2" style={{ border: `1px solid ${C.border}`, fontFamily: FONT_BODY, fontSize: 13 }} />
                        <input value={editInstalled} onChange={(e) => setEditInstalled(e.target.value)} placeholder="Install year, e.g. 2020" className="w-full px-3 py-2 rounded-xl outline-none" style={{ border: `1px solid ${C.border}`, fontFamily: FONT_BODY, fontSize: 13 }} />

                        <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 10, marginBottom: 5 }}>Receipt</div>
                        {a.receiptPhoto ? (
                          <div className="flex items-center gap-2">
                            <img src={a.receiptPhoto} alt="receipt" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} />
                            <button onClick={() => receiptFileRef.current?.click()} style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: C.accentDark, fontWeight: 600 }}>Replace photo</button>
                          </div>
                        ) : (
                          <button onClick={() => receiptFileRef.current?.click()} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl" style={{ border: `1.5px dashed ${C.border}`, color: C.inkSoft, fontFamily: FONT_BODY, fontSize: 12 }}>
                            <Receipt size={13} /> Attach receipt photo
                          </button>
                        )}
                        <input ref={receiptFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleReceiptFile(e, a.id)} />

                        <div className="flex gap-2 mt-2.5">
                          <button onClick={deleteEditAsset} className="py-2 px-3 rounded-xl" style={{ border: `1px solid ${C.brick}`, color: C.brick, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600 }}>Delete</button>
                          <button onClick={saveEditAsset} className="flex-1 py-2 rounded-xl" style={{ background: C.ink, color: "#fff", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600 }}>Save changes</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3" ref={photosRef}>
        <SectionHeader
          title="Photo timeline"
          subtitle="Every before/after, scan, and receipt for this home in one place"
          meta={`${allPhotos.length}`}
          open={photosOpen}
          onToggle={() => setPhotosOpen((v) => !v)}
        />
        {photosOpen && (
          allPhotos.length === 0 ? (
            <div className="rounded-2xl p-3 mt-2" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.inkSoft }}>No photos yet — diagnoses, scans, and receipts will build a timeline here automatically.</div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              {allPhotos.map((p, i) => (
                <div key={i} className="relative" style={{ aspectRatio: "1", borderRadius: 10, overflow: "hidden" }}>
                  <img src={p.url} alt={p.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1" style={{ background: "rgba(35,47,56,0.75)" }}>
                    <span style={{ fontFamily: FONT_BODY, fontSize: 8, color: "#fff" }}>{p.label}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <div className="mt-8 space-y-1.5">
        <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Settings</div>

        <button onClick={onOpenEditProfile} className="w-full flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.ink }}>Your profile</span>
          <ChevronRight size={15} color={C.inkFaint} />
        </button>

        <button onClick={onOpenPaywall} className="w-full flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.ink }}>Your plan</span>
          <div className="flex items-center gap-1.5">
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: subscription.status === "free" ? C.amber : C.sage, fontWeight: 600 }}>
              {subscription.status === "free" ? `${freeProjectsUsed}/${FREE_PROJECT_LIMIT} free used` : subscription.status === "trial" ? "Trial" : SUBSCRIPTION_PLANS[subscription.plan].name}
            </span>
            <ChevronRight size={15} color={C.inkFaint} />
          </div>
        </button>

        <button ref={paymentRef} onClick={() => setExpandedSetting(expandedSetting === "payment" ? null : "payment")} className="w-full flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.ink }}>Payment methods</span>
          <ChevronRight size={15} color={C.inkFaint} style={{ transform: expandedSetting === "payment" ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
        </button>
        {expandedSetting === "payment" && (
          <div className="rounded-2xl p-3 mb-2" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            {paymentMethods.length === 0 && (
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.inkSoft, marginBottom: 8 }}>No payment methods on file.</div>
            )}
            {paymentMethods.map((pm, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <CreditCard size={14} color={C.inkSoft} />
                  <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.ink }}>{pm.brand} •••• {pm.last4}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: C.inkFaint }}>Exp {pm.exp}</span>
                  <button onClick={() => removeCard(i)}><Trash2 size={13} color={C.brick} /></button>
                </div>
              </div>
            ))}
            {addingCard ? (
              <div className="rounded-xl p-2.5 mt-2" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="Card number" inputMode="numeric" className="w-full px-3 py-2 rounded-xl outline-none mb-2" style={{ border: `1px solid ${C.border}`, fontFamily: FONT_MONO, fontSize: 13, background: C.surface }} />
                <input value={cardExp} onChange={(e) => setCardExp(e.target.value)} placeholder="MM/YY" className="w-full px-3 py-2 rounded-xl outline-none mb-2" style={{ border: `1px solid ${C.border}`, fontFamily: FONT_MONO, fontSize: 13, background: C.surface }} />
                <div className="flex gap-2">
                  <button onClick={() => { setAddingCard(false); setCardNumber(""); setCardExp(""); }} className="flex-1 py-2 rounded-xl" style={{ border: `1px solid ${C.border}`, color: C.inkSoft, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600 }}>Cancel</button>
                  <button onClick={saveCard} className="flex-1 py-2 rounded-xl" style={{ background: C.ink, color: "#fff", fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600 }}>Save card</button>
                </div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: C.inkFaint, marginTop: 6, lineHeight: 1.4 }}>Only the card type and last 4 digits are kept — this is a demo, not a real payment form.</div>
              </div>
            ) : (
              <button onClick={() => setAddingCard(true)} className="w-full mt-2 py-2 rounded-xl flex items-center justify-center gap-1.5" style={{ border: `1px solid ${C.border}`, color: C.accentDark, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600 }}>
                <Plus size={12} /> Add payment method
              </button>
            )}
          </div>
        )}

        <button ref={receiptsRef} onClick={() => setExpandedSetting(expandedSetting === "receipts" ? null : "receipts")} className="w-full flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.ink }}>Receipts</span>
          <div className="flex items-center gap-1.5">
            {allReceipts.length > 0 && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.inkFaint }}>{allReceipts.length}</span>}
            <ChevronRight size={15} color={C.inkFaint} style={{ transform: expandedSetting === "receipts" ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
          </div>
        </button>
        {expandedSetting === "receipts" && (
          <div className="rounded-2xl p-3 mb-2" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            {allReceipts.length === 0 ? (
              <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.inkSoft, lineHeight: 1.4 }}>No receipts yet — attach one from an item in Your Home, or after completing a project, and it'll show up here automatically.</div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {allReceipts.map((r, i) => (
                  <div key={i} className="relative" style={{ aspectRatio: "1", borderRadius: 10, overflow: "hidden" }}>
                    <img src={r.url} alt={r.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1" style={{ background: "rgba(35,47,56,0.75)" }}>
                      <span style={{ fontFamily: FONT_BODY, fontSize: 8, color: "#fff" }}>{r.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <button ref={pushnotifsRef} onClick={() => setExpandedSetting(expandedSetting === "notifications" ? null : "notifications")} className="w-full flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.ink }}>Notifications</span>
          <ChevronRight size={15} color={C.inkFaint} style={{ transform: expandedSetting === "notifications" ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
        </button>
        {expandedSetting === "notifications" && (
          <div className="rounded-2xl p-3 mb-2" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            {Object.keys(notifPrefs).map((key) => (
              <div key={key} className="flex items-center justify-between py-1.5">
                <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.ink }}>{NOTIF_PREF_LABELS[key]}</span>
                <ToggleSwitch on={notifPrefs[key]} onClick={() => setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }))} />
              </div>
            ))}
          </div>
        )}

        <button ref={textsizeRef} onClick={() => setExpandedSetting(expandedSetting === "textsize" ? null : "textsize")} className="w-full flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.ink }}>Text size</span>
          <ChevronRight size={15} color={C.inkFaint} style={{ transform: expandedSetting === "textsize" ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
        </button>
        {expandedSetting === "textsize" && (
          <div className="rounded-2xl p-3 mb-2" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <div className="flex gap-1.5">
              {[{ label: "Normal", value: 1 }, { label: "Large", value: 1.15 }, { label: "Extra large", value: 1.3 }].map((opt) => (
                <button key={opt.label} onClick={() => onSetTextScale(opt.value)} className="flex-1 py-2 rounded-xl" style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 600, background: textScale === opt.value ? C.ink : C.bg, color: textScale === opt.value ? "#fff" : C.inkSoft, border: `1px solid ${textScale === opt.value ? C.ink : C.border}` }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <button ref={languageRef} onClick={() => setExpandedSetting(expandedSetting === "language" ? null : "language")} className="w-full flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.ink }}>Language</span>
          <div className="flex items-center gap-1.5">
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.inkFaint }}>{language}</span>
            <ChevronRight size={15} color={C.inkFaint} style={{ transform: expandedSetting === "language" ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
          </div>
        </button>
        {expandedSetting === "language" && (
          <div className="rounded-2xl p-3 mb-2" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button key={lang} onClick={() => setLanguage(lang)} className="px-3 py-1.5 rounded-full" style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, background: language === lang ? C.ink : C.bg, color: language === lang ? "#fff" : C.inkSoft, border: `1px solid ${language === lang ? C.ink : C.border}` }}>
                  {lang}
                </button>
              ))}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.inkFaint, marginTop: 8, lineHeight: 1.4 }}>
              This sets your preference — full translation of the app isn't wired up in this prototype yet.
            </div>
          </div>
        )}

        <button ref={supportRef} onClick={() => setExpandedSetting(expandedSetting === "support" ? null : "support")} className="w-full flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.ink }}>Support</span>
          <ChevronRight size={15} color={C.inkFaint} style={{ transform: expandedSetting === "support" ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
        </button>
        {expandedSetting === "support" && <SupportChatBot />}

        <button onClick={onPreviewOnboarding} className="w-full flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.ink }}>Preview onboarding</span>
          <ChevronRight size={15} color={C.inkFaint} />
        </button>

        <button ref={referralRowRef} onClick={() => setExpandedSetting(expandedSetting === "referral" ? null : "referral")} className="w-full flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.ink }}>Invite a neighbor</span>
          <div className="flex items-center gap-1.5">
            {referralCredit > 0 && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.sage, fontWeight: 700 }}>${referralCredit}</span>}
            <ChevronRight size={15} color={C.inkFaint} style={{ transform: expandedSetting === "referral" ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
          </div>
        </button>
        {expandedSetting === "referral" && (
          <div className="rounded-2xl p-3 mb-2" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.inkSoft, lineHeight: 1.4, marginBottom: 10 }}>
              Share your code — when a neighbor completes their first project, you both get $20 credit.
            </div>
            <div className="flex items-center justify-between rounded-xl p-2.5 mb-2" style={{ background: C.bg, border: `1px dashed ${C.border}` }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.ink, fontWeight: 700 }}>{referralCode}</span>
              <span style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.accentDark, fontWeight: 600 }}>Tap to copy</span>
            </div>
            <button onClick={onAddReferralCredit} className="w-full py-2 rounded-xl" style={{ border: `1.5px solid ${C.accent}`, color: C.accentDark, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700 }}>
              Simulate: a neighbor joined with your code
            </button>
            {referralCredit > 0 && (
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.sage, marginTop: 8, textAlign: "center", fontWeight: 600 }}>
                ${referralCredit} in credit ready for your next project
              </div>
            )}
          </div>
        )}

        <button onClick={onOpenPassport} className="w-full flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.ink }}>Home Passport</span>
          <ChevronRight size={15} color={C.inkFaint} />
        </button>

        <button onClick={onLogout} className="w-full flex items-center justify-between py-3 mt-1">
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.brick, fontWeight: 600 }}>Log out</span>
          <ChevronRight size={15} color={C.brick} />
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------- ONBOARDING ---------------------------------- */
const HOME_TYPES = ["House", "Condo", "Townhouse", "Duplex"];

function OnboardingProgress({ step }) {
  return (
    <div className="flex items-center gap-1.5 px-6 pt-4">
      {[1, 2, 3, 4, 5].map((n) => (
        <div key={n} className="flex-1" style={{ height: 3, borderRadius: 999, background: n <= step ? C.accent : C.border }} />
      ))}
    </div>
  );
}

function OnboardingField({ label, value, onChange, placeholder, type }) {
  return (
    <div className="mb-3">
      <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type || "text"}
        className="w-full px-3.5 py-3 rounded-2xl outline-none"
        style={{ border: `1px solid ${C.border}`, background: C.surface, fontFamily: FONT_BODY, fontSize: 14, color: C.ink }}
      />
    </div>
  );
}

function TourPreviewDiagnose() {
  return (
    <div className="w-full rounded-2xl p-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <div className="flex justify-end mb-2">
        <div className="rounded-2xl overflow-hidden" style={{ width: 70, height: 50, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Camera size={18} color={C.inkFaint} />
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-2xl" style={{ background: C.bg, width: "fit-content" }}>
        {[0, 1, 2].map((i) => <span key={i} style={{ width: 5, height: 5, borderRadius: 999, background: C.accent }} />)}
      </div>
    </div>
  );
}
function TourPreviewDiagnosis() {
  return (
    <div className="w-full rounded-2xl p-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between mb-1.5">
        <span style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 12, color: C.ink }}>Water stain on ceiling</span>
        <span className="px-1.5 py-0.5 rounded-full" style={{ background: C.amberSoft, color: C.amber, fontFamily: FONT_MONO, fontSize: 8, fontWeight: 700 }}>MEDIUM</span>
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.sage, fontWeight: 700, marginBottom: 6 }}>$220–$650</div>
      <div className="flex gap-1.5">
        <div className="flex-1 py-1.5 rounded-lg text-center" style={{ background: C.bg, fontFamily: FONT_BODY, fontSize: 9, color: C.inkSoft }}>DIY it</div>
        <div className="flex-1 py-1.5 rounded-lg text-center" style={{ background: C.ink, fontFamily: FONT_BODY, fontSize: 9, color: "#fff" }}>Find a pro</div>
      </div>
    </div>
  );
}
function TourPreviewProjects() {
  return (
    <div className="w-full rounded-2xl p-3 flex items-center gap-2.5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <div className="grid grid-cols-2 gap-1" style={{ width: 52, height: 40 }}>
        <div style={{ background: C.bg, borderRadius: 6 }} />
        <div style={{ background: C.sageSoft, borderRadius: 6 }} />
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11.5, color: C.ink }}>Driveway pressure washing</div>
        <span className="px-1.5 py-0.5 rounded-full inline-block mt-1" style={{ background: C.sageSoft, color: C.sage, fontFamily: FONT_MONO, fontSize: 8, fontWeight: 700 }}>COMPLETED</span>
      </div>
    </div>
  );
}
function TourPreviewProfile() {
  const rows = ["Seasonal checklist", "Recurring nudges", "Your home"];
  return (
    <div className="w-full rounded-2xl p-2.5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      {rows.map((r) => (
        <div key={r} className="flex items-center justify-between py-1.5" style={{ borderBottom: r !== "Your home" ? `1px solid ${C.border}` : "none" }}>
          <span style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 11, color: C.ink }}>{r}</span>
          <ChevronDown size={12} color={C.accentDark} />
        </div>
      ))}
    </div>
  );
}

const TOUR_STEPS = [
  { Preview: TourPreviewDiagnose, title: "Show us the issue", desc: "Tap the camera on Home to snap a photo or video of anything that's off \u2014 leaks, noises, cracked tiles, anything at all.", ctaTab: "home", ctaLabel: "Try it on Home" },
  { Preview: TourPreviewDiagnosis, title: "Get a real diagnosis", desc: "We'll explain what it likely is, how urgent it is, a cost range, and whether it's safe to fix yourself or worth calling a pro.", ctaTab: "home", ctaLabel: "Try it on Home" },
  { Preview: TourPreviewProjects, title: "Track every project", desc: "The Projects tab keeps tabs on anything current, past, or suggested \u2014 plus your seasonal checklist and nudges.", ctaTab: "projects", ctaLabel: "Open Projects" },
  { Preview: TourPreviewProfile, title: "Your home, remembered", desc: "Profile keeps your home's systems, warranties, past contractors, and photo history all in one place.", ctaTab: "profile", ctaLabel: "Open Profile" },
];

function TourScreen({ onDone, onTryIt }) {
  const [step, setStep] = useState(0);
  const t = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;
  return (
    <div className="h-full flex flex-col px-6 pt-6 pb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          {TOUR_STEPS.map((_, i) => (
            <div key={i} style={{ width: i === step ? 18 : 6, height: 6, borderRadius: 999, background: i === step ? C.accent : C.border, transition: "width 0.2s" }} />
          ))}
        </div>
        <button onClick={onDone} style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.inkFaint }}>Skip</button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="mb-6" style={{ width: "100%", maxWidth: 220 }}>
          <t.Preview />
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: C.ink, marginBottom: 10 }}>{t.title}</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.inkSoft, lineHeight: 1.5, maxWidth: 260 }}>{t.desc}</div>
      </div>
      <button onClick={() => onTryIt(t.ctaTab)} className="w-full py-2.5 mb-2 rounded-2xl" style={{ border: `1.5px solid ${C.accent}`, color: C.accentDark, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700 }}>
        {t.ctaLabel}
      </button>
      <PrimaryButton onClick={() => (isLast ? onDone() : setStep((s) => s + 1))}>{isLast ? "Let's go" : "Next"}</PrimaryButton>
    </div>
  );
}

function HelpSearchScreen({ onBack, onNavigate }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const results = q === "" ? HELP_TOPICS : HELP_TOPICS.filter((h) => h.title.toLowerCase().includes(q) || h.keywords.some((k) => k.includes(q) || q.includes(k)));
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 pt-5 pb-3">
        <button onClick={onBack}><ChevronLeft size={20} color={C.ink} /></button>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: C.ink }}>Help</span>
      </div>
      <div className="px-5 pb-3">
        <div className="flex items-center gap-2 rounded-2xl px-3 py-2.5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <Search size={15} color={C.inkFaint} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search anything — "warranty", "nudges", "quote"…'
            className="flex-1 bg-transparent outline-none"
            style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.ink }}
            autoFocus
          />
        </div>
      </div>
      <div className="px-5 flex-1 overflow-y-auto pb-4">
        {results.length === 0 ? (
          <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.inkFaint, textAlign: "center", marginTop: 20 }}>No matches — try a different word, or use Support in Profile Settings.</div>
        ) : (
          <div className="space-y-1.5">
            {results.map((h) => (
              <button key={h.title} onClick={() => onNavigate(h)} className="w-full text-left rounded-2xl p-3 flex items-center justify-between" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <div className="min-w-0">
                  <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13, color: C.ink }}>{h.title}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: C.inkSoft, marginTop: 1 }}>{h.desc}</div>
                </div>
                <ChevronRight size={15} color={C.inkFaint} style={{ flexShrink: 0 }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OnboardingFlow({ onComplete, onExitPreview, initialStep }) {
  const [step, setStep] = useState(initialStep || 0);
  const [authMode, setAuthMode] = useState("choice");
  const [loginMethod, setLoginMethod] = useState("phone");
  const [authPhone, setAuthPhone] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authPassword2, setAuthPassword2] = useState("");
  const [authError, setAuthError] = useState("");
  const [name, setName] = useState("");
  const [propertyNickname, setPropertyNickname] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyUnit, setPropertyUnit] = useState("");
  const [propertyPostal, setPropertyPostal] = useState("");
  const [homeType, setHomeType] = useState("House");
  const [yearBuilt, setYearBuilt] = useState("");
  const [sqft, setSqft] = useState("");
  const [roofYear, setRoofYear] = useState("");
  const [hvacYear, setHvacYear] = useState("");
  const [waterHeaterYear, setWaterHeaterYear] = useState("");
  const [taskChecks, setTaskChecks] = useState(() => {
    const init = {};
    INITIAL_SEASONAL_TASKS.forEach((t) => (init[t.id] = t.done));
    return init;
  });
  const onboardingSeason = currentSeason();
  const onboardingSeasonTasks = INITIAL_SEASONAL_TASKS.filter((t) => t.season === onboardingSeason);

  const [authLoading, setAuthLoading] = useState(false);

  async function submitLogin() {
    const identifier = loginMethod === "phone" ? authPhone : authEmail;
    if (!identifier.trim() || !authPassword.trim()) {
      setAuthError("Enter your " + (loginMethod === "phone" ? "phone number" : "email") + " and password.");
      return;
    }
    setAuthError("");
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword(
      loginMethod === "phone" ? { phone: identifier.trim(), password: authPassword } : { email: identifier.trim(), password: authPassword }
    );
    setAuthLoading(false);
    if (error) {
      setAuthError(error.message);
      return;
    }
    next();
  }

  async function submitRegister() {
    if (!authPhone.trim() || !authEmail.trim() || !authPassword.trim()) {
      setAuthError("Fill in your phone, email, and password.");
      return;
    }
    if (authPassword !== authPassword2) {
      setAuthError("Those passwords don't match.");
      return;
    }
    setAuthError("");
    setAuthLoading(true);
    const { error } = await supabase.auth.signUp({
      email: authEmail.trim(),
      password: authPassword,
      phone: authPhone.trim(),
    });
    setAuthLoading(false);
    if (error) {
      setAuthError(error.message);
      return;
    }
    // profiles + subscriptions rows are created automatically by the
    // on_auth_user_created trigger in db/schema.sql — nothing to do here.
    setAuthMode("verify");
  }

  function next() {
    setStep((s) => s + 1);
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }
  function toggleOnboardingTask(id) {
    setTaskChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function finish() {
    const systems = [];
    if (roofYear.trim()) systems.push({ category: "Roof", label: "Roof", installed: roofYear.trim(), warranty: /^\d{4}$/.test(roofYear.trim()) ? String(Number(roofYear.trim()) + 25) : "—" });
    if (hvacYear.trim()) systems.push({ category: "HVAC", label: "HVAC system", installed: hvacYear.trim(), warranty: /^\d{4}$/.test(hvacYear.trim()) ? String(Number(hvacYear.trim()) + 15) : "—" });
    if (waterHeaterYear.trim()) systems.push({ category: "Water Heater", label: "Water heater", installed: waterHeaterYear.trim(), warranty: /^\d{4}$/.test(waterHeaterYear.trim()) ? String(Number(waterHeaterYear.trim()) + 10) : "—" });
    const seasonalTasks = INITIAL_SEASONAL_TASKS.map((t) => ({ ...t, done: !!taskChecks[t.id] }));
    onComplete({
      name: name.trim() || "Homeowner",
      propertyNickname: propertyNickname.trim() || "My Home",
      propertyAddress: propertyAddress.trim() || "Vancouver, BC",
      propertyUnit: propertyUnit.trim(),
      propertyPostal: propertyPostal.trim(),
      homeType, yearBuilt: yearBuilt.trim(), sqft: sqft.trim(), systems, seasonalTasks,
    });
  }

  return (
    <div className="h-full flex flex-col">
      {(step > 0 || onExitPreview) && (
        <div className="flex items-center justify-between px-4 pt-3">
          {step > 0 ? <button onClick={back}><ChevronLeft size={20} color={C.ink} /></button> : <div />}
          {onExitPreview && (
            <button onClick={onExitPreview} style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.inkSoft }}>Exit preview</button>
          )}
        </div>
      )}
      {step > 0 && <OnboardingProgress step={step} />}

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4 flex flex-col">
        {step === 0 && authMode === "choice" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="flex items-center justify-center mb-5" style={{ width: 84, height: 84, borderRadius: 999, background: `radial-gradient(circle at 35% 30%, ${C.accent}, ${C.accentDark})`, boxShadow: `0 8px 24px -6px ${C.accent}88` }}>
              <HomeIcon size={34} color="#fff" />
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: C.ink }}>HomeAi</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: C.inkSoft, marginTop: 10, lineHeight: 1.5, maxWidth: 260 }}>
              Your home's personal concierge — diagnose issues, find trusted pros, and keep everything about your home in one place.
            </div>
            <div className="w-full mt-8 space-y-2">
              <PrimaryButton onClick={() => { setAuthMode("register"); setAuthError(""); }}>Create an account</PrimaryButton>
              <button onClick={() => { setAuthMode("login"); setAuthError(""); }} className="w-full py-3 rounded-2xl" style={{ border: `1.5px solid ${C.border}`, color: C.ink, fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700 }}>
                Log in
              </button>
            </div>
          </div>
        )}

        {step === 0 && authMode === "login" && (
          <div className="flex-1 flex flex-col">
            <button onClick={() => setAuthMode("choice")} className="flex items-center gap-1 mb-4" style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.inkSoft }}>
              <ChevronLeft size={15} /> Back
            </button>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: C.ink, marginBottom: 4 }}>Log in</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.inkFaint, marginBottom: 16 }}>Use your phone number or email.</div>
            <div className="flex gap-1.5 mb-3">
              {[{ key: "phone", label: "Phone number" }, { key: "email", label: "Email" }].map((opt) => (
                <button key={opt.key} onClick={() => setLoginMethod(opt.key)} className="flex-1 py-2 rounded-xl" style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 700, background: loginMethod === opt.key ? C.ink : C.surface, color: loginMethod === opt.key ? "#fff" : C.inkSoft, border: `1px solid ${loginMethod === opt.key ? C.ink : C.border}` }}>
                  {opt.label}
                </button>
              ))}
            </div>
            {loginMethod === "phone" ? (
              <OnboardingField label="Phone number" value={authPhone} onChange={setAuthPhone} placeholder="(604) 555-0100" />
            ) : (
              <OnboardingField label="Email" value={authEmail} onChange={setAuthEmail} placeholder="you@example.com" />
            )}
            <OnboardingField label="Password" value={authPassword} onChange={setAuthPassword} placeholder="••••••••" type="password" />
            {authError && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.brick, marginBottom: 8 }}>{authError}</div>}
            <div className="flex-1" />
            <PrimaryButton onClick={submitLogin} disabled={authLoading}>{authLoading ? "Logging in…" : "Log in"}</PrimaryButton>
          </div>
        )}

        {step === 0 && authMode === "register" && (
          <div className="flex-1 flex flex-col">
            <button onClick={() => setAuthMode("choice")} className="flex items-center gap-1 mb-4" style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.inkSoft }}>
              <ChevronLeft size={15} /> Back
            </button>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: C.ink, marginBottom: 4 }}>Create an account</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.inkFaint, marginBottom: 16 }}>We'll email you a link to verify it's really you.</div>
            <OnboardingField label="Phone number" value={authPhone} onChange={setAuthPhone} placeholder="(604) 555-0100" />
            <OnboardingField label="Email" value={authEmail} onChange={setAuthEmail} placeholder="you@example.com" />
            <OnboardingField label="Password" value={authPassword} onChange={setAuthPassword} placeholder="••••••••" type="password" />
            <OnboardingField label="Confirm password" value={authPassword2} onChange={setAuthPassword2} placeholder="••••••••" type="password" />
            {authError && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.brick, marginBottom: 8 }}>{authError}</div>}
            <div className="flex-1" />
            <PrimaryButton onClick={submitRegister} disabled={authLoading}>{authLoading ? "Creating account…" : "Create account"}</PrimaryButton>
          </div>
        )}

        {step === 0 && authMode === "verify" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="flex items-center justify-center mb-5" style={{ width: 76, height: 76, borderRadius: 999, background: C.sageSoft }}>
              <Mail size={30} color={C.sage} />
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: C.ink, marginBottom: 8 }}>Check your email</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.inkSoft, lineHeight: 1.5, maxWidth: 260, marginBottom: 20 }}>
              We've sent a verification link to <strong style={{ color: C.ink }}>{authEmail}</strong>. This is a demo, so you can continue right away without clicking it.
            </div>
            <div className="w-full"><PrimaryButton onClick={next}>Continue</PrimaryButton></div>
          </div>
        )}

        {step === 1 && (
          <div className="flex-1 flex flex-col">
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: C.ink, marginBottom: 4 }}>What should we call you?</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.inkFaint, marginBottom: 18 }}>Just your name is fine.</div>
            <OnboardingField label="Your name" value={name} onChange={setName} placeholder="e.g. Alex Rivera" />
            <div className="flex-1" />
            <PrimaryButton onClick={next}>Continue</PrimaryButton>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col">
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: C.ink, marginBottom: 4 }}>Let's set up your first property</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.inkFaint, marginBottom: 18, lineHeight: 1.4 }}>This helps us tailor suggestions and match you with pros nearby. You can add more properties later.</div>
            <OnboardingField label="Nickname" value={propertyNickname} onChange={setPropertyNickname} placeholder="e.g. Point Grey Home" />
            <OnboardingField label="Address" value={propertyAddress} onChange={setPropertyAddress} placeholder="Street, city, province" />
            <div className="flex gap-3">
              <div className="flex-1"><OnboardingField label="Unit # (if any)" value={propertyUnit} onChange={setPropertyUnit} placeholder="e.g. 204" /></div>
              <div className="flex-1"><OnboardingField label="Postal code" value={propertyPostal} onChange={setPropertyPostal} placeholder="e.g. V6T 1Z4" /></div>
            </div>
            <div className="flex-1" />
            <PrimaryButton onClick={next} disabled={!propertyNickname.trim() || !propertyAddress.trim()}>Continue</PrimaryButton>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 flex flex-col">
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: C.ink, marginBottom: 4 }}>A bit about your home</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.inkFaint, marginBottom: 14, lineHeight: 1.4 }}>This helps the AI give more accurate, home-specific suggestions.</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Home type</div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {HOME_TYPES.map((t) => (
                <button key={t} onClick={() => setHomeType(t)} className="px-3 py-1.5 rounded-full" style={{ fontFamily: FONT_BODY, fontSize: 12, background: homeType === t ? C.ink : C.surface, color: homeType === t ? "#fff" : C.inkSoft, border: `1px solid ${homeType === t ? C.ink : C.border}` }}>
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <div className="flex-1"><OnboardingField label="Year built" value={yearBuilt} onChange={setYearBuilt} placeholder="e.g. 2005" /></div>
              <div className="flex-1"><OnboardingField label="Square feet" value={sqft} onChange={setSqft} placeholder="e.g. 1800" /></div>
            </div>
            <div className="flex-1" />
            <PrimaryButton onClick={next}>Continue</PrimaryButton>
          </div>
        )}

        {step === 4 && (
          <div className="flex-1 flex flex-col">
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: C.ink, marginBottom: 4 }}>When were these last installed?</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.inkFaint, marginBottom: 18, lineHeight: 1.4 }}>Skip anything you're not sure about — you can always add it later in Profile.</div>
            <OnboardingField label="Roof (year)" value={roofYear} onChange={setRoofYear} placeholder="Not sure? Leave blank" />
            <OnboardingField label="HVAC / furnace (year)" value={hvacYear} onChange={setHvacYear} placeholder="Not sure? Leave blank" />
            <OnboardingField label="Water heater (year)" value={waterHeaterYear} onChange={setWaterHeaterYear} placeholder="Not sure? Leave blank" />
            <div className="flex-1" />
            <PrimaryButton onClick={next}>Continue</PrimaryButton>
          </div>
        )}

        {step === 5 && (
          <div className="flex-1 flex flex-col">
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: C.ink, marginBottom: 4 }}>Your {onboardingSeason.toLowerCase()} checklist</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.inkFaint, marginBottom: 16, lineHeight: 1.4 }}>We keep this to what's relevant right now — check off anything you've already handled recently.</div>
            <div className="space-y-1.5">
              {onboardingSeasonTasks.map((t) => {
                const done = !!taskChecks[t.id];
                return (
                  <button key={t.id} onClick={() => toggleOnboardingTask(t.id)} className="w-full flex items-center gap-2.5 rounded-2xl p-3" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="flex items-center justify-center flex-shrink-0" style={{ width: 18, height: 18, borderRadius: 6, border: `1.5px solid ${done ? C.sage : C.inkFaint}`, background: done ? C.sage : "transparent" }}>
                      {done && <CheckCircle2 size={12} color="#fff" />}
                    </div>
                    <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.ink }}>{t.label}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: C.inkFaint, marginTop: 10 }}>You can always adjust this later in Profile.</div>
            <div className="flex-1" />
            <PrimaryButton onClick={finish}>Start using HomeAi</PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------- APP SHELL ---------------------------------- */
function BottomNav({ tab, setTab, flashingTab }) {
  const items = [
    { key: "home", label: "Home", icon: HomeIcon },
    { key: "projects", label: "Projects", icon: Clock },
    { key: "profile", label: "Profile", icon: User },
  ];
  return (
    <div className="flex items-center justify-around py-2.5" style={{ borderTop: `1px solid ${C.border}`, background: C.surface }}>
      {items.map(({ key, label, icon: Icon }) => {
        const flashing = flashingTab === key;
        return (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex flex-col items-center gap-1 px-4 py-1 rounded-2xl"
            style={{ background: flashing ? C.accentSoft : "transparent", animation: flashing ? "homeaiFlash 0.6s ease-in-out 3" : "none" }}
          >
            <Icon size={19} color={tab === key ? C.accentDark : C.inkFaint} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: tab === key ? C.accentDark : C.inkFaint, fontWeight: tab === key ? 600 : 400 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function HomeAiPrototype() {
  const [onboarded, setOnboarded] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [onboardingInitialStep, setOnboardingInitialStep] = useState(0);
  const [ownerName, setOwnerName] = useState("Homeowner");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");
  const [ownerPhoto, setOwnerPhoto] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [tab, setTab] = useState("home");
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [historyFlash, setHistoryFlash] = useState(false);

  function deriveConversationTitle(msgs) {
    const firstUserText = msgs.find((m) => m.role === "user" && m.kind === "text");
    if (firstUserText) return deriveGenericTitle(firstUserText.text);
    const firstUserMedia = msgs.find((m) => m.role === "user" && (m.kind === "photo" || m.kind === "video"));
    if (firstUserMedia) return firstUserMedia.kind === "video" ? "Video from home" : "Photo from home";
    return "Conversation";
  }

  function saveCurrentConversation(msgsToSave) {
    const snapshot = msgsToSave || messages;
    if (snapshot.length === 0) return;
    const title = deriveConversationTitle(snapshot);
    if (activeConversationId) {
      setConversations((prev) => prev.map((c) => (c.id === activeConversationId ? { ...c, messages: snapshot, title } : c)));
    } else {
      const id = `convo-${Date.now()}`;
      setConversations((prev) => [{ id, title, messages: snapshot }, ...prev]);
      setActiveConversationId(id);
    }
  }

  function resetChat() {
    const hadContent = messages.length > 0;
    saveCurrentConversation();
    setMessages([]);
    setActiveConversationId(null);
    if (hadContent) {
      setHistoryFlash(true);
      setTimeout(() => setHistoryFlash(false), 2400);
    }
  }

  function openConversation(id) {
    saveCurrentConversation();
    const convo = conversations.find((c) => c.id === id);
    if (convo) {
      setMessages(convo.messages);
      setActiveConversationId(id);
    }
  }
  const [jobs, setJobs] = useState(SEED_JOBS);
  const [properties, setProperties] = useState(INITIAL_PROPERTIES);
  const [activeHomeId, setActiveHomeId] = useState(INITIAL_PROPERTIES[0].id);
  const [assetsByHome, setAssetsByHome] = useState({ [INITIAL_PROPERTIES[0].id]: INITIAL_ASSETS });
  const [nudgesByHome, setNudgesByHome] = useState({ [INITIAL_PROPERTIES[0].id]: freshNudges() });
  const [tasksByHome, setTasksByHome] = useState({ [INITIAL_PROPERTIES[0].id]: freshSeasonalTasks() });
  const [historyScreen, setHistoryScreen] = useState("list");
  const [activeJob, setActiveJob] = useState(null);
  const [seed, setSeed] = useState(null);
  const [viewingContractor, setViewingContractor] = useState(null);
  const [freeProjectsUsed, setFreeProjectsUsed] = useState(0);
  const [subscription, setSubscription] = useState({ status: "free", plan: null, billing: null, trialMonthsLeft: 0 });
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallReason, setPaywallReason] = useState("manual");
  const [household, setHousehold] = useState([]);
  const [prototypeMode, setPrototypeMode] = useState("v1");
  const [leadsByContractor, setLeadsByContractor] = useState({});
  const [textScale, setTextScale] = useState(1);
  const [referralCredit, setReferralCredit] = useState(0);
  const [showPassport, setShowPassport] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [flashingTab, setFlashingTab] = useState(null);
  const [deepLinkTarget, setDeepLinkTarget] = useState(null);

  function handleHelpNavigate(topic) {
    setShowHelp(false);
    // Overlay-direct targets skip tabs entirely and open the exact screen.
    if (topic.target === "yourPlan") {
      setPaywallReason("manual");
      setShowPaywall(true);
      return;
    }
    if (topic.target === "household" || topic.target === "yourProfile") {
      setShowEditProfile(true);
      return;
    }
    if (topic.target === "passport") {
      setShowPassport(true);
      return;
    }
    goTab(topic.tab);
    setDeepLinkTarget(topic.target);
    setFlashingTab(topic.tab);
    setTimeout(() => setFlashingTab(null), 2200);
  }
  const [lockedAddresses, setLockedAddresses] = useState([]);
  const [firstCompletionNudgeShown, setFirstCompletionNudgeShown] = useState(false);
  const [limitReachedPopupShown, setLimitReachedPopupShown] = useState(false);

  function maybeShowCompletionPaywall() {
    if (subscription.status !== "free") return;
    if (freeProjectsUsed >= FREE_PROJECT_LIMIT && !limitReachedPopupShown) {
      setLimitReachedPopupShown(true);
      setTimeout(() => {
        setPaywallReason("limitReached");
        setShowPaywall(true);
      }, 700);
      return;
    }
    if (freeProjectsUsed === 1 && !firstCompletionNudgeShown) {
      setFirstCompletionNudgeShown(true);
      setTimeout(() => {
        setPaywallReason("firstCompletion");
        setShowPaywall(true);
      }, 700);
    }
  }

  function logLeadsSent(names) {
    setLeadsByContractor((prev) => {
      const next = { ...prev };
      names.forEach((n) => {
        next[n] = (next[n] || 0) + 1;
      });
      return next;
    });
  }

  function patchJob(id, patch) {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
    setActiveJob((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
    if (patch.status === "Completed") maybeShowCompletionPaywall();
  }

  function requestQuoteV1(trade, issueTitle, photoUrl, contractorNames) {
    addJob({
      title: issueTitle, trade, type: "job", flowVersion: "v1", status: "Requested Quote",
      requestedContractors: contractorNames, contractor: null, quotedPrice: null, scheduledDate: null,
      estimate: null, beforePhoto: photoUrl || null, afterPhoto: null, declinedQuotes: [], receiptPhoto: null,
    });
    logLeadsSent(contractorNames);
  }
  const [viewingClaim, setViewingClaim] = useState(null);
  const householdIdRef = useRef(1);

  function addHouseholdMember(name, phone, relation) {
    const id = householdIdRef.current++;
    setHousehold((prev) => [...prev, { id, name, phone, relation }]);
  }

  function deleteHouseholdMember(id) {
    setHousehold((prev) => prev.filter((m) => m.id !== id));
  }

  function openClaim(job) {
    setViewingClaim(job);
  }

  function closeClaim() {
    setViewingClaim(null);
  }

  function addReferralCredit() {
    setReferralCredit((prev) => prev + 20);
  }

  function saveProfile({ name, phone, email, address, photo }) {
    setOwnerName(name);
    setOwnerPhone(phone);
    setOwnerEmail(email);
    setOwnerAddress(address);
    setOwnerPhoto(photo);
  }
  const jobIdRef = useRef(3);
  const propIdRef = useRef(2);

  // Runs once on load: is there a real, current login already? If so, skip
  // the login/register screens. If they're logged in but never finished
  // setting up a property, resume onboarding at the property step instead
  // of making them log in again. If there's no session at all, the default
  // state above (onboarded: false, step: 0) already shows the full
  // login/register flow, so there's nothing to do in that case.
  useEffect(() => {
    let cancelled = false;
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) setSessionChecked(true);
        return;
      }
      try {
        const res = await fetch(`${BACKEND_URL}/api/me`, { headers: { Authorization: `Bearer ${session.access_token}` } });
        const me = await res.json();
        if (cancelled) return;
        if (me.profile) {
          setOwnerName(me.profile.name || "Homeowner");
          setOwnerPhone(me.profile.phone || "");
          setOwnerEmail(me.profile.email || "");
          setOwnerAddress(me.profile.mailing_address || "");
          setOwnerPhoto(me.profile.photo_url || null);
        }
        if (me.properties && me.properties.length > 0) {
          // Has a real property already — load it and skip onboarding.
          // NOTE: this loads the property itself, but not yet its jobs/assets/
          // nudges/etc. — that's the next wiring pass (see FRONTEND_DATA.md).
          const loaded = me.properties.map((p) => ({ id: p.id, nickname: p.nickname, address: p.address }));
          setProperties(loaded);
          setActiveHomeId(loaded[0].id);
          setOnboarded(true);
        } else {
          // Logged in, but never finished setting up a property.
          setOnboardingInitialStep(1);
        }
      } catch (err) {
        console.error("Session check failed:", err);
      }
      if (!cancelled) setSessionChecked(true);
    }
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setOnboarded(false);
        setOnboardingInitialStep(0);
      }
    });

    return () => {
      cancelled = true;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  function startTrial(plan, billing) {
    setSubscription({ status: "trial", plan, billing, trialMonthsLeft: TRIAL_MONTHS });
    setShowPaywall(false);
  }

  const assets = assetsByHome[activeHomeId] || [];
  const nudges = nudgesByHome[activeHomeId] || [];
  const tasks = tasksByHome[activeHomeId] || [];
  const activeProperty = properties.find((p) => p.id === activeHomeId) || properties[0];
  const pastJobsForActiveHome = jobs.filter((j) => j.homeId === activeHomeId && j.status === "Completed" && j.type === "job");
  const addressLocked = activeProperty ? lockedAddresses.includes(activeProperty.address) : false;
  const canBook = subscription.status !== "free" || (freeProjectsUsed < FREE_PROJECT_LIMIT && !addressLocked);

  function viewContractor(name, trade, extra) {
    const record = findContractorRecord(trade, name);
    setViewingContractor({
      name,
      trade: trade || "General",
      rating: record?.rating ?? null,
      reviews: record?.reviews ?? null,
      address: record?.address ?? null,
      phone: record?.phone ?? null,
      source: record?.source || "google",
      lastJob: extra?.lastJob || null,
      lastDate: extra?.lastDate || null,
    });
  }

  function toggleTask(id) {
    setTasksByHome((prev) => ({ ...prev, [activeHomeId]: (prev[activeHomeId] || []).map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }));
  }

  function setTaskTimeline(id, timeline) {
    setTasksByHome((prev) => ({ ...prev, [activeHomeId]: (prev[activeHomeId] || []).map((t) => (t.id === id ? { ...t, timeline } : t)) }));
  }

  function addTask(season, label, timeline) {
    const id = `${season.toLowerCase()}-custom-${Date.now()}`;
    setTasksByHome((prev) => ({ ...prev, [activeHomeId]: [...(prev[activeHomeId] || []), { id, season, label, timeline, done: false }] }));
  }

  function deleteTask(id) {
    setTasksByHome((prev) => ({ ...prev, [activeHomeId]: (prev[activeHomeId] || []).filter((t) => t.id !== id) }));
  }

  async function completeOnboarding(data) {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Save the real name onto their profile (the signup trigger only sets email).
      await supabase.from("profiles").update({ name: data.name }).eq("id", user.id);
    }

    let homeId = 1; // fallback if the insert fails, so the demo still doesn't hard-crash
    if (user) {
      const { data: newProperty, error } = await supabase
        .from("properties")
        .insert({
          owner_id: user.id,
          nickname: data.propertyNickname,
          address: data.propertyAddress,
          unit: data.propertyUnit,
          postal_code: data.propertyPostal,
          home_type: data.homeType,
          year_built: data.yearBuilt,
          sqft: data.sqft,
        })
        .select()
        .single();
      if (error) {
        console.error("Could not save property to the database:", error);
      } else {
        homeId = newProperty.id;
      }
    }

    setOwnerName(data.name);
    setProperties([{ id: homeId, nickname: data.propertyNickname, address: data.propertyAddress, unit: data.propertyUnit, postal: data.propertyPostal, homeType: data.homeType, yearBuilt: data.yearBuilt, sqft: data.sqft }]);
    setActiveHomeId(homeId);
    const builtAssets = data.systems.map((s, i) => ({ id: i + 1, category: s.category, label: s.label, installed: s.installed, warranty: s.warranty }));
    setAssetsByHome({ [homeId]: builtAssets });
    setTasksByHome({ [homeId]: freshSeasonalTasks(data.seasonalTasks) });
    setJobs((prev) => prev.map((j) => (j.homeId === 1 ? { ...j, homeId, homeNickname: data.propertyNickname } : j)));
    setTab("home");
    setOnboarded(true);
    setShowTour(true);
  }

  function previewOnboarding() {
    setOnboarded(false);
  }

  function exitOnboardingPreview() {
    setTab("home");
    setOnboarded(true);
  }

  function requestFromNudge(nudge) {
    requestFromText(nudge.label);
  }

  function requestFromText(text) {
    setSeed({ text });
    setViewingContractor(null);
    goTab("home");
  }

  function addProperty(nickname, address, unit, postal) {
    const id = propIdRef.current++;
    setProperties((prev) => [...prev, { id, nickname, address, unit, postal }]);
    setAssetsByHome((prev) => ({ ...prev, [id]: [] }));
    setNudgesByHome((prev) => ({ ...prev, [id]: freshNudges() }));
    setTasksByHome((prev) => ({ ...prev, [id]: freshSeasonalTasks() }));
    setActiveHomeId(id);
  }

  function addAsset(asset) {
    setAssetsByHome((prev) => ({ ...prev, [activeHomeId]: [...(prev[activeHomeId] || []), asset] }));
  }

  function editAsset(id, patch) {
    setAssetsByHome((prev) => ({ ...prev, [activeHomeId]: (prev[activeHomeId] || []).map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
  }

  function deleteAsset(id) {
    setAssetsByHome((prev) => ({ ...prev, [activeHomeId]: (prev[activeHomeId] || []).filter((a) => a.id !== id) }));
  }

  function toggleNudge(id) {
    setNudgesByHome((prev) => ({ ...prev, [activeHomeId]: (prev[activeHomeId] || []).map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n)) }));
  }

  function addNudge(label, freq, day) {
    const id = `custom_${Date.now()}`;
    setNudgesByHome((prev) => ({ ...prev, [activeHomeId]: [...(prev[activeHomeId] || []), { id, label, icon: Wrench, enabled: true, freq, day: day || "Mon", trade: "Handyman" }] }));
  }

  function setNudgeDay(id, day) {
    setNudgesByHome((prev) => ({ ...prev, [activeHomeId]: (prev[activeHomeId] || []).map((n) => (n.id === id ? { ...n, day } : n)) }));
  }

  function deleteNudge(id) {
    setNudgesByHome((prev) => ({ ...prev, [activeHomeId]: (prev[activeHomeId] || []).filter((n) => n.id !== id) }));
  }

  function setNudgeFreq(id, freq) {
    setNudgesByHome((prev) => ({ ...prev, [activeHomeId]: (prev[activeHomeId] || []).map((n) => (n.id === id ? { ...n, freq } : n)) }));
  }

  function addJob(job) {
    const id = jobIdRef.current++;
    setJobs((prev) => [{ id, homeId: activeHomeId, homeNickname: activeProperty.nickname, ...job }, ...prev]);
    if (job.type === "job") {
      setFreeProjectsUsed((prev) => {
        const next = prev + 1;
        if (next >= FREE_PROJECT_LIMIT && subscription.status === "free" && activeProperty?.address) {
          setLockedAddresses((prevAddrs) => (prevAddrs.includes(activeProperty.address) ? prevAddrs : [...prevAddrs, activeProperty.address]));
        }
        return next;
      });
    }
  }

  function scheduleRecurring(nudge, contractorName) {
    if (!canBook) {
      setPaywallReason("limitReached");
      setShowPaywall(true);
      return;
    }
    const id = jobIdRef.current++;
    setJobs((prev) => [
      {
        id, homeId: activeHomeId, homeNickname: activeProperty.nickname,
        title: nudge.label, trade: nudge.trade, type: "recurring", status: "Pending",
        contractor: contractorName, frequency: `${nudge.freq}, ${nudge.day}s`,
        visits: [],
      },
      ...prev,
    ]);
    setFreeProjectsUsed((prev) => {
      const next = prev + 1;
      if (next >= FREE_PROJECT_LIMIT && subscription.status === "free" && activeProperty?.address) {
        setLockedAddresses((prevAddrs) => (prevAddrs.includes(activeProperty.address) ? prevAddrs : [...prevAddrs, activeProperty.address]));
      }
      return next;
    });
    logLeadsSent([contractorName]);
  }

  function logVisit(jobId, visit) {
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, visits: [visit, ...(j.visits || [])] } : j)));
    setActiveJob((prev) => (prev && prev.id === jobId ? { ...prev, visits: [visit, ...(prev.visits || [])] } : prev));
  }

  function openJob(job) {
    setActiveJob(job);
    setHistoryScreen("detail");
  }

  function uploadAfterPhoto(jobId, url) {
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, afterPhoto: url } : j)));
    setActiveJob((prev) => (prev && prev.id === jobId ? { ...prev, afterPhoto: url } : prev));
  }

  function advanceStatus(jobId) {
    function next(status) {
      const idx = STAGES.indexOf(status);
      return STAGES[Math.min(idx + 1, STAGES.length - 2)];
    }
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: next(j.status) } : j)));
    setActiveJob((prev) => (prev && prev.id === jobId ? { ...prev, status: next(prev.status) } : prev));
  }

  function completeJob() {
    setHistoryScreen("payment");
  }

  function pay() {
    setJobs((prev) => prev.map((j) => (j.id === activeJob.id ? { ...j, status: "Completed" } : j)));
    setActiveJob((prev) => (prev ? { ...prev, status: "Completed" } : prev));
    setHistoryScreen("receipt");
  }

  function finishReceipt() {
    setHistoryScreen("list");
    setActiveJob(null);
    maybeShowCompletionPaywall();
  }

  function goTab(key) {
    setTab(key);
    setHistoryScreen("list");
    setActiveJob(null);
    setViewingContractor(null);
    setShowPaywall(false);
    setViewingClaim(null);
    setShowPassport(false);
    setShowEditProfile(false);
  }

  function logOut() {
    supabase.auth.signOut();
    setOnboarded(false);
    setOnboardingInitialStep(0);
    setOwnerName("Homeowner");
    setTab("home");
    setMessages([]);
    setJobs(SEED_JOBS);
    setProperties(INITIAL_PROPERTIES);
    setActiveHomeId(INITIAL_PROPERTIES[0].id);
    setAssetsByHome({ [INITIAL_PROPERTIES[0].id]: INITIAL_ASSETS });
    setNudgesByHome({ [INITIAL_PROPERTIES[0].id]: freshNudges() });
    setTasksByHome({ [INITIAL_PROPERTIES[0].id]: freshSeasonalTasks() });
    setHistoryScreen("list");
    setActiveJob(null);
    setSeed(null);
    setViewingContractor(null);
  }

  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "#EDE7DC", fontFamily: FONT_BODY, minHeight: 760 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');
        @keyframes homeaiBounce { 0%, 60%, 100% { transform: translateY(0); opacity: .5; } 30% { transform: translateY(-4px); opacity: 1; } }
        @keyframes homeaiFlash { 0%, 100% { background: transparent; } 50% { background: ${C.accentSoft}; } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes homeaiBadgeFlash { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.5); } }
        ::-webkit-scrollbar { width: 0px; }
      `}</style>

      <div className="relative overflow-hidden flex flex-col" style={{ width: 390, height: 760, borderRadius: 40, background: C.bg, boxShadow: "0 30px 60px -20px rgba(35,47,56,0.35)", border: "8px solid #1B1B1B" }}>
        <div className="flex items-center justify-between px-6 pt-2 pb-1" style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.ink }}>
          <span>9:41</span>
          <span>●●●</span>
        </div>

        <div className="flex-1 min-h-0 relative" style={{ zoom: textScale }}>
          {!sessionChecked ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                {[0, 1, 2].map((i) => <span key={i} style={{ width: 6, height: 6, borderRadius: 999, background: C.accent, animation: `homeaiBounce 1s ${i * 0.15}s infinite ease-in-out` }} />)}
              </div>
            </div>
          ) : !onboarded ? (
            <OnboardingFlow onComplete={completeOnboarding} onExitPreview={exitOnboardingPreview} initialStep={onboardingInitialStep} />
          ) : showTour ? (
            <TourScreen onDone={() => setShowTour(false)} onTryIt={(tabKey) => { setShowTour(false); goTab(tabKey); }} />
          ) : (
            <>
              {tab === "home" && (
                <HomeTab
                  messages={messages}
                  setMessages={setMessages}
                  addJob={addJob}
                  nudges={nudges}
                  activeProperty={activeProperty}
                  pastJobs={pastJobsForActiveHome}
                  seed={seed}
                  onSeedConsumed={() => setSeed(null)}
                  canBook={canBook}
                  onPaywallNeeded={() => { setPaywallReason("limitReached"); setShowPaywall(true); }}
                  subscription={subscription}
                  prototypeMode={prototypeMode}
                  onRequestQuoteV1={requestQuoteV1}
                  onResetChat={resetChat}
                  conversations={conversations}
                  activeConversationId={activeConversationId}
                  onOpenConversation={openConversation}
                  historyFlash={historyFlash}
                  deepLinkTarget={tab === "home" ? deepLinkTarget : null}
                  onDeepLinkConsumed={() => setDeepLinkTarget(null)}
                  leadsByContractor={leadsByContractor}
                  onSetPrototypeMode={setPrototypeMode}
                />
              )}
              {tab === "projects" && historyScreen === "list" && (
                <ProjectsTab jobs={jobs} onOpenJob={openJob} properties={properties} nudges={nudges} onRequestFromNudge={requestFromNudge} deepLinkTarget={tab === "projects" ? deepLinkTarget : null} onDeepLinkConsumed={() => setDeepLinkTarget(null)} />
              )}
              {tab === "projects" && historyScreen === "detail" && activeJob && (
                <JobDetailScreen job={activeJob} onBack={() => setHistoryScreen("list")} onComplete={completeJob} onUploadAfterPhoto={uploadAfterPhoto} onAdvanceStatus={advanceStatus} onViewContractor={viewContractor} onExportClaim={openClaim} onPatchJob={patchJob} onLogVisit={logVisit} />
              )}
              {tab === "projects" && historyScreen === "payment" && activeJob && <PaymentScreen job={activeJob} onPay={pay} />}
              {tab === "projects" && historyScreen === "receipt" && activeJob && <ReceiptScreen job={activeJob} onDone={finishReceipt} />}
              {tab === "profile" && (
                <ProfileTab
                  ownerName={ownerName}
                  ownerPhoto={ownerPhoto}
                  onOpenEditProfile={() => setShowEditProfile(true)}
                  onSetOwnerName={setOwnerName}
                  assets={assets}
                  addAsset={addAsset}
                  editAsset={editAsset}
                  deleteAsset={deleteAsset}
                  nudges={nudges}
                  onToggleNudge={toggleNudge}
                  onSetNudgeFreq={setNudgeFreq}
                  onSetNudgeDay={setNudgeDay}
                  onAddNudge={addNudge}
                  onDeleteNudge={deleteNudge}
                  onScheduleRecurring={scheduleRecurring}
                  properties={properties}
                  activeHomeId={activeHomeId}
                  onSelectHome={setActiveHomeId}
                  onAddProperty={addProperty}
                  jobs={jobs}
                  onRequestAgain={requestFromText}
                  onLogout={logOut}
                  tasks={tasks}
                  onToggleTask={toggleTask}
                  onSetTaskTimeline={setTaskTimeline}
                  onAddTask={addTask}
                  onDeleteTask={deleteTask}
                  onPreviewOnboarding={previewOnboarding}
                  onViewContractor={viewContractor}
                  subscription={subscription}
                  freeProjectsUsed={freeProjectsUsed}
                  onOpenPaywall={() => { setPaywallReason("manual"); setShowPaywall(true); }}
                  household={household}
                  onAddHousehold={addHouseholdMember}
                  onDeleteHousehold={deleteHouseholdMember}
                  textScale={textScale}
                  onSetTextScale={setTextScale}
                  referralCredit={referralCredit}
                  onAddReferralCredit={addReferralCredit}
                  onOpenPassport={() => setShowPassport(true)}
                  deepLinkTarget={tab === "profile" ? deepLinkTarget : null}
                  onDeepLinkConsumed={() => setDeepLinkTarget(null)}
                />
              )}
            </>
          )}

          {onboarded && viewingContractor && (
            <div className="absolute inset-0" style={{ background: C.bg, zIndex: 30 }}>
              <ContractorProfileScreen contractor={viewingContractor} onBack={() => setViewingContractor(null)} onRequestAgain={requestFromText} />
            </div>
          )}

          {onboarded && showPaywall && (
            <div className="absolute inset-0" style={{ background: C.bg, zIndex: 40 }}>
              <PaywallScreen subscription={subscription} freeProjectsUsed={freeProjectsUsed} addressLocked={addressLocked} reason={paywallReason} onBack={() => setShowPaywall(false)} onStartTrial={startTrial} />
            </div>
          )}

          {onboarded && viewingClaim && (
            <div className="absolute inset-0" style={{ background: C.bg, zIndex: 40 }}>
              <ClaimSummaryScreen job={viewingClaim} property={properties.find((p) => p.id === viewingClaim.homeId)} onBack={closeClaim} />
            </div>
          )}

          {onboarded && showPassport && (
            <div className="absolute inset-0" style={{ background: C.bg, zIndex: 40 }}>
              <HomePassportScreen property={activeProperty} jobs={jobs} assets={assets} onBack={() => setShowPassport(false)} />
            </div>
          )}

          {onboarded && showEditProfile && (
            <div className="absolute inset-0" style={{ background: C.bg, zIndex: 45 }}>
              <EditProfileScreen
                ownerName={ownerName}
                ownerPhone={ownerPhone}
                ownerEmail={ownerEmail}
                ownerAddress={ownerAddress}
                ownerPhoto={ownerPhoto}
                onSave={saveProfile}
                household={household}
                onAddHousehold={addHouseholdMember}
                onDeleteHousehold={deleteHouseholdMember}
                onBack={() => setShowEditProfile(false)}
              />
            </div>
          )}

          {onboarded && showHelp && (
            <div className="absolute inset-0" style={{ background: C.bg, zIndex: 50 }}>
              <HelpSearchScreen onBack={() => setShowHelp(false)} onNavigate={handleHelpNavigate} />
            </div>
          )}

          {onboarded && !showTour && !showHelp && (
            <button
              onClick={() => setShowHelp(true)}
              className="absolute flex items-center justify-center"
              style={{ bottom: 14, right: 14, width: 40, height: 40, borderRadius: 999, background: C.ink, boxShadow: "0 4px 12px -2px rgba(0,0,0,0.35)", zIndex: 60 }}
            >
              <HelpCircle size={19} color="#fff" />
            </button>
          )}
        </div>

        {onboarded && !showTour && !viewingContractor && !showPaywall && !viewingClaim && !showPassport && !showHelp && !showEditProfile && <BottomNav tab={tab} setTab={goTab} flashingTab={flashingTab} />}
      </div>
    </div>
  );
}
