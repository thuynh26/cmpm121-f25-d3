// @deno-types="npm:@types/leaflet"
import leaflet from "leaflet";

// Style sheets
import "leaflet/dist/leaflet.css"; // supporting style for Leaflet
import "./style.css";

// Leaflet missing marker imgs fix
import "./_leafletWorkaround.ts";

// Import our luck/RNG function -- unused for now
// import luck from "./_luck.ts"

// =============== GAME PARAMETERS =============== //
const MAP_CENTER = leaflet.latLng(0, 0);
const GAMEPLAY_ZOOM_LVL = 1;

// =============== UI ELEMENTS =============== //

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

// =============== LEAFLET MAP =============== //
const map = leaflet.map(mapDiv, {
  center: MAP_CENTER,
  zoom: GAMEPLAY_ZOOM_LVL,
});

leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);
