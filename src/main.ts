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
const MAP_CENTER = leaflet.latLng(0, 0);
const GAMEPLAY_ZOOM_LVL = 19;

const TILE_DEGREES = 1e-4;
const TOKEN_SPAWN_PROB = 0.10;

// temp for D3.a use (so that map covers viewable screen)
const GRID_SIZE = 28;

const PICKUP_RANGE = 3;
const WIN_CONDITION = 16;

// ============================== UI ELEMENTS ============================== //
const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

const nButton = document.createElement("button");
nButton.innerHTML = "North";
nButton.id = "buttons";
document.body.append(nButton);

const sButton = document.createElement("button");
sButton.innerHTML = "South";
sButton.id = "buttons";
document.body.append(sButton);

const eButton = document.createElement("button");
eButton.innerHTML = "East";
eButton.id = "buttons";
document.body.append(eButton);

const wButton = document.createElement("button");
wButton.innerHTML = "West";
wButton.id = "buttons";
document.body.append(wButton);

const inventoryDiv = document.createElement("div");
inventoryDiv.id = "inventory";
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

// ============================== MAP GRID ============================== //
// Convert lat/lng to integer cell indices relative to MAP_CENTER
function latLngToCell(lat: number, lng: number) {
  const i = Math.floor((lat - MAP_CENTER.lat) / TILE_DEGREES);
  const j = Math.floor((lng - MAP_CENTER.lng) / TILE_DEGREES);
  return { i, j };
}

function cellBounds(i: number, j: number) {
  // SW corner (lower-left)
  const lat0 = MAP_CENTER.lat + i * TILE_DEGREES;
  const lng0 = MAP_CENTER.lng + j * TILE_DEGREES;

  // NE corner (upper-right)
  const lat1 = lat0 + TILE_DEGREES;
  const lng1 = lng0 + TILE_DEGREES;
  return leaflet.latLngBounds([lat0, lng0], [lat1, lng1]);
}

// ============================== INTERACTION SYSTEM ============================== //
// map marker to represent the player
let playerLocation = MAP_CENTER;
const playerCell = latLngToCell(playerLocation.lat, playerLocation.lng);

const playerMarker = leaflet.marker(playerLocation);
playerMarker.addTo(map).bindTooltip("That's you!");

nButton.onclick = () => {
  movePlayer(1, 0);
};

sButton.onclick = () => {
  movePlayer(-1, 0);
};

eButton.onclick = () => {
  movePlayer(0, 1);
};

wButton.onclick = () => {
  movePlayer(0, -1);
};

function movePlayer(di: number, dj: number) {
  playerLocation = leaflet.latLng(
    playerLocation.lat + di * TILE_DEGREES,
    playerLocation.lng + dj * TILE_DEGREES,
  );
  playerMarker.setLatLng(playerLocation);
}

function isInRange(i: number, j: number) {
  return (
    Math.abs(i - playerCell.i) + Math.abs(j - playerCell.j) <= PICKUP_RANGE
  );
}

// ============================== TOKEN SYSTEM ============================== //
function spawnToken(i: number, j: number) {
  const spawnRoll = luck(`${i},${j}:value`);

  const value = spawnRoll < 0.5 ? 2 : 4;
  return value;
}

function tokenIcon(value: number) {
  return leaflet.divIcon({
    className: "token-text",
    html: value > 0 ? `<span class="token-pill">${value}</span>` : "0",
  });
}

function addTokenLabel(i: number, j: number, value: number): leaflet.Marker {
  const center = cellBounds(i, j).getCenter();

  return leaflet.marker(center, {
    interactive: false,
    icon: tokenIcon(value),
  }).addTo(map);
}

function setTokenLabel(label: leaflet.Marker, value: number) {
  label.setIcon(tokenIcon(value));
}

// ============================== INVENTORY SYSTEM ============================== //
let holdToken: number | null = null;

// checks for win condition token value in inventory (not on board)
function updateInventoryUI(msg?: string) {
  const held = holdToken == null ? "(empty)" : String(holdToken);
  inventoryDiv.textContent = `Inventory: ${held}${msg ? "  --  " + msg : ""}`;
  checkWinCondit();
}

function checkWinCondit() {
  if (holdToken === WIN_CONDITION) {
    inventoryDiv.textContent =
      `Inventory: ${holdToken}  --  Yayyy Goal reached!!`;
    alert("CONGRATS YOU WIN!");
  }
}

// ============================== HELPER FUNCTIONS ============================== //

function cellClickHandler(
  cell: leaflet.Rectangle,
  i: number,
  j: number,
  cellState: { tokenValue: number },
  label: leaflet.Marker,
) {
  if (!isInRange(i, j)) {
    cell.bindTooltip("Too far!");
    return;
  }

  // case: not holding anything -> pick up token
  if (holdToken == null) {
    holdToken = cellState.tokenValue;
    cellState.tokenValue = 0;
    setTokenLabel(label, cellState.tokenValue);
    updateInventoryUI(`Picked up ${holdToken}`);
    return;
  }

  // case: holding a token already -> place on cell if EMPTY
  if (cellState.tokenValue === 0) {
    cellState.tokenValue = holdToken;
    holdToken = null;
    setTokenLabel(label, cellState.tokenValue);
    updateInventoryUI(`Placed down ${cellState.tokenValue}`);
    return;
  }

  // case: craft token (combine held token with ground token if same value)
  if (holdToken === cellState.tokenValue) {
    cellState.tokenValue = cellState.tokenValue * 2;
    holdToken = null;
    setTokenLabel(label, cellState.tokenValue);
    updateInventoryUI(`Crafted new token: ${cellState.tokenValue}`);
    return;
  }

  // block picking up if values differ
  updateInventoryUI(`Cell has ${cellState.tokenValue}. Need equal to craft.`);
}

// ============================== BUILD CELLS ============================== //
updateInventoryUI();

for (let i = -GRID_SIZE / 2; i < GRID_SIZE / 2; i++) {
  for (let j = -GRID_SIZE; j < GRID_SIZE; j++) {
    if (luck([i, j].toString()) < TOKEN_SPAWN_PROB) {
      const nearby = isInRange(i, j);

      const cell = leaflet.rectangle(cellBounds(i, j), {
        weight: 1,
        color: nearby ? "#2987dfff" : "#2f2b50ff",
      });
      cell.addTo(map);

      const cellState = { tokenValue: spawnToken(i, j) };
      const label = addTokenLabel(i, j, cellState.tokenValue);

      // token "pick up" handler
      cell.on("click", () => cellClickHandler(cell, i, j, cellState, label));
    }
  }
}
