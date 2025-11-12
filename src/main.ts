// @deno-types="npm:@types/leaflet"
import leaflet from "leaflet";

// Style sheets
import "leaflet/dist/leaflet.css"; // supporting style for Leaflet
import "./style.css";

// Leaflet missing marker imgs fix
import "./_leafletWorkaround.ts";

// Import our luck/RNG function
import luck from "./_luck.ts";

import coin1Url from "./coin1.png";
import coin2Url from "./coin2.png";

// ============================== GAME PARAMETERS ============================== //
// Map center is set to classroom
const MAP_CENTER = leaflet.latLng(36.997936938057016, -122.05703507501151);
const GAMEPLAY_ZOOM_LVL = 19;
const TILE_DEGREES = 1e-4;
const TOKEN_SPAWN_PROB = 0.10;

// temp for D3.a use (so that map covers viewable screen)
const GRID_SIZE = 28;

const tokenIcon1 = leaflet.icon({
  iconUrl: coin1Url,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const tokenIcon2 = leaflet.icon({
  iconUrl: coin2Url,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

// ============================== UI ELEMENTS ============================== //

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

// ============================== LEAFLET MAP ============================== //
const map = leaflet.map(mapDiv, {
  center: MAP_CENTER,
  zoom: GAMEPLAY_ZOOM_LVL,
  minZoom: GAMEPLAY_ZOOM_LVL,
  maxZoom: GAMEPLAY_ZOOM_LVL,
  zoomControl: false,
  scrollWheelZoom: false,
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

// ============================== TOKEN SYSTEM ============================== //
function spawnToken(i: number, j: number) {
  const spawnRoll = luck([i, j].toString());

  const value = spawnRoll ? (Math.random() < 0.5 ? 1 : 2) : 0;

  addTokenLabel(i, j, value);
  return value;
}

function addTokenLabel(i: number, j: number, value: number): leaflet.Marker {
  const center = cellBounds(i, j).getCenter();
  const icon = value === 1 ? tokenIcon1 : value === 2 ? tokenIcon2 : tokenIcon1;

  return leaflet.marker(center, {
    icon: icon,
  }).addTo(map).bindTooltip(`${value}`);
}

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

for (let i = -GRID_SIZE / 2; i < GRID_SIZE / 2; i++) {
  for (let j = -GRID_SIZE; j < GRID_SIZE; j++) {
    if (luck([i, j].toString()) < TOKEN_SPAWN_PROB) {
      const cell = leaflet.rectangle(cellBounds(i, j), {
        weight: 1,
        fillOpacity: 0.04,
      });
      cell.addTo(map);

      spawnToken(i, j);
    }
  }
}
