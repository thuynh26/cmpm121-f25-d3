// @deno-types="npm:@types/leaflet"
import leaflet from "leaflet";

// Style sheets
import "leaflet/dist/leaflet.css"; // supporting style for Leaflet
import "./style.css";

// Leaflet missing marker imgs fix
import "./_leafletWorkaround.ts";

// Import our luck/RNG function -- unused for now
// import luck from "./_luck.ts"

// ============================== GAME PARAMETERS ============================== //
// Map center is set to classroom
const MAP_CENTER = leaflet.latLng(36.997936938057016, -122.05703507501151);
const GAMEPLAY_ZOOM_LVL = 20;
const TILE_DEGREES = 1e-4;
const GRID_SIZE = 13;

// ============================== UI ELEMENTS ============================== //

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

// ============================== LEAFLET MAP ============================== //
const map = leaflet.map(mapDiv, {
  center: MAP_CENTER,
  zoom: GAMEPLAY_ZOOM_LVL,
});

// adds a bkgd tile layer to map
leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

// map marker to represent the player
const playerMarker = leaflet.marker(MAP_CENTER);
playerMarker.addTo(map).bindTooltip("That's you!");

// ============================== MAP GRID ============================== //
function cellBounds(i: number, j: number) {
  // SW corner (lower-left)
  const lat0 = MAP_CENTER.lat + i * TILE_DEGREES;
  const lng0 = MAP_CENTER.lng + j * TILE_DEGREES;

  // NE corner (upper-right)
  const lat1 = lat0 + TILE_DEGREES;
  const lng1 = lng0 + TILE_DEGREES;
  return leaflet.latLngBounds([lat0, lng0], [lat1, lng1]);
}

for (let i = -GRID_SIZE; i < GRID_SIZE; i++) {
  for (let j = -GRID_SIZE; j < GRID_SIZE; j++) {
    const cell = leaflet.rectangle(cellBounds(i, j));
    cell.addTo(map);
  }
}
