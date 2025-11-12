// @deno-types="npm:@types/leaflet"
import leaflet from "leaflet";

// Style sheets
import "leaflet/dist/leaflet.css"; // supporting style for Leaflet
import "./style.css";

// Leaflet missing marker imgs fix
import "./_leafletWorkaround.ts";

// Import our luck/RNG function
import luck from "./_luck.ts";

// ============================== GAME PARAMETERS ============================== //
// Map center is set to classroom
const MAP_CENTER = leaflet.latLng(36.997936938057016, -122.05703507501151);
const GAMEPLAY_ZOOM_LVL = 19;

const TILE_DEGREES = 1e-4;
const TOKEN_SPAWN_PROB = 0.10;

// temp for D3.a use (so that map covers viewable screen)
const GRID_SIZE = 28;

const PICKUP_RANGE = 3;

// ============================== UI ELEMENTS ============================== //

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

const inventoryDiv = document.createElement("div");
inventoryDiv.id = "inventory";
inventoryDiv.textContent = "Held: (empty)";
document.body.append(inventoryDiv);

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
  const spawnRoll = luck(`${i},${j}:value`);

  const value = spawnRoll < 0.5 ? 2 : 4;
  return value;
}

function addTokenLabel(i: number, j: number, value: number): leaflet.Marker {
  const center = cellBounds(i, j).getCenter();

  return leaflet.marker(center, {
    interactive: false,
    icon: leaflet.divIcon({
      className: "token-text",
      html: `<span class="token-pill">${value}</span>`,
    }),
  }).addTo(map);
}

function setTokenLabel(label: leaflet.Marker, value: number) {
  label.setIcon(
    leaflet.divIcon({
      className: "token-text",
      html: value > 0 ? `<span class="token-pill">${value}</span>` : "0",
    }),
  );
}

// ============================== INTERACTION SYSTEM ============================== //

// Convert lat/lng to integer cell indices relative to MAP_CENTER
function latLngToCell(lat: number, lng: number) {
  const i = Math.floor((lat - MAP_CENTER.lat) / TILE_DEGREES);
  const j = Math.floor((lng - MAP_CENTER.lng) / TILE_DEGREES);
  return { i, j };
}

// Player cell (fixed at classroom for now)
const playerCell = latLngToCell(MAP_CENTER.lat, MAP_CENTER.lng);

function isInRange(i: number, j: number) {
  return (
    Math.abs(i - playerCell.i) + Math.abs(j - playerCell.j) <= PICKUP_RANGE
  );
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
      const nearby = isInRange(i, j);

      const cell = leaflet.rectangle(cellBounds(i, j), {
        weight: 1,
        color: nearby ? "#2987dfff" : "#888",
      });
      cell.addTo(map);

      let tokenValue = spawnToken(i, j);
      const label = addTokenLabel(i, j, tokenValue);

      cell.on("click", () => {
        if (!isInRange(i, j)) {
          cell.bindTooltip("Too far!");
          return;
        }

        tokenValue = 0;
        setTokenLabel(label, tokenValue);
      });
    }
  }
}
