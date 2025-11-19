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
  dragging: true,
});

// adds a bkgd tile layer to map
leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

// ============================== MAP GRID ============================== //
type CellId = string;
type GridIndexes = { i: number; j: number };
type CellState = { tokenValue: number };

type CellLayer = {
  index: GridIndexes;
  cell: leaflet.Rectangle;
  label: leaflet.Marker;
  state: CellState;
};

// Map to track what layer a cell was rendered in using its id
const mapLayers = new Map<CellId, CellLayer>();

// Convert lat/lng to integer cell indices relative to MAP_CENTER
function latLngToCell(lat: number, lng: number) {
  const i = Math.floor((lat - MAP_CENTER.lat) / TILE_DEGREES);
  const j = Math.floor((lng - MAP_CENTER.lng) / TILE_DEGREES);
  return { i, j };
}

function cellBounds(atIndex: GridIndexes) {
  // SW corner (lower-left)
  const lat0 = MAP_CENTER.lat + atIndex.i * TILE_DEGREES;
  const lng0 = MAP_CENTER.lng + atIndex.j * TILE_DEGREES;

  // NE corner (upper-right)
  const lat1 = lat0 + TILE_DEGREES;
  const lng1 = lng0 + TILE_DEGREES;
  return leaflet.latLngBounds([lat0, lng0], [lat1, lng1]);
}

// redraw grid when map is moved
map.on("moveend", drawGrid);

function drawGrid() {
  const bounds = map.getBounds();
  const swCell = latLngToCell(bounds.getSouth(), bounds.getWest());
  const neCell = latLngToCell(bounds.getNorth(), bounds.getEast());
  console.log(swCell, neCell);

  // track which cells have already been drawn
  const seen = new Set<CellId>();

  for (let i = swCell.i; i <= neCell.i; i++) {
    for (let j = swCell.j; j <= neCell.j; j++) {
      const atIndex = { i, j };

      if (luck([i, j].toString()) < TOKEN_SPAWN_PROB) {
        spawnCell(atIndex);
        seen.add(`${i},${j}`);
      }
    }
  }

  // remove cells that are not in view
  for (const id of mapLayers.keys()) {
    if (!seen.has(id)) removeCell(id);
  }
}

function spawnCell(atIndex: GridIndexes) {
  const id = `${atIndex.i},${atIndex.j}`;
  const nearby = isInRange(atIndex);

  const layer = mapLayers.get(id);

  // only draw cells if not already drawn
  if (!layer) {
    const cell = leaflet.rectangle(cellBounds(atIndex), {
      weight: 1,
      color: nearby ? "#2987dfff" : "#2f2b50ff",
    });
    cell.addTo(map);

    const state: CellState = { tokenValue: spawnToken(atIndex) };
    const label = addTokenLabel(atIndex, state.tokenValue);

    // store in mapLayers
    const thisLayer = { index: atIndex, cell: cell, label, state };
    mapLayers.set(id, thisLayer);

    // token "pick up" handler
    cell.on(
      "click",
      () => cellClickHandler(thisLayer),
    );
  } else {
    // update cell style if player moves
    layer.cell.setStyle({
      color: nearby ? "#2987dfff" : "#2f2b50ff",
    });
  }
}

function removeCell(id: CellId) {
  const layer = mapLayers.get(id);
  if (!layer) return;
  layer.cell.remove();
  layer.label.remove();
  mapLayers.delete(id);
}

// ============================== TOKEN SYSTEM ============================== //
function spawnToken(atIndex: GridIndexes) {
  const spawnRoll = luck(`${atIndex.i},${atIndex.j}:value`);

  return spawnRoll < 0.5 ? 2 : 4;
}

function tokenIcon(value: number) {
  return leaflet.divIcon({
    className: "token-text",
    html: value > 0 ? `<span class="token-pill">${value}</span>` : "",
  });
}

function addTokenLabel(atIndex: GridIndexes, value: number): leaflet.Marker {
  const center = cellBounds(atIndex).getCenter();

  return leaflet.marker(center, {
    interactive: false,
    icon: tokenIcon(value),
  }).addTo(map);
}

function setTokenLabel(label: leaflet.Marker, value: number) {
  label.setIcon(tokenIcon(value));
}

// ============================== INTERACTION SYSTEM ============================== //
// map marker to represent the player
// spawn player at map center index
let playerCell: GridIndexes = { i: 0, j: 0 };

// put player in center of cell
let playerLocation = cellBounds(playerCell).getCenter();

const playerMarker = leaflet.marker(playerLocation);
playerMarker.addTo(map).bindTooltip("That's you!");

nButton.onclick = () => movePlayer(1, 0);
sButton.onclick = () => movePlayer(-1, 0);
eButton.onclick = () => movePlayer(0, 1);
wButton.onclick = () => movePlayer(0, -1);

function movePlayer(di: number, dj: number) {
  playerCell = {
    i: playerCell.i + di,
    j: playerCell.j + dj,
  };

  playerLocation = cellBounds(playerCell).getCenter();
  playerMarker.setLatLng(playerLocation);

  drawGrid();
}

function isInRange(atIndex: GridIndexes) {
  return (
    Math.abs(atIndex.i - playerCell.i) + Math.abs(atIndex.j - playerCell.j) <=
      PICKUP_RANGE
  );
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

// ============================== CELL INTERACTION HANDLER ============================== //

function cellClickHandler(layer: CellLayer) {
  const { index, cell, label, state } = layer;

  if (!isInRange(index)) {
    cell.bindTooltip("Too far!").openTooltip();
    return;
  }

  // case: not holding anything -> pick up token
  if (holdToken == null) {
    if (state.tokenValue == 0) {
      updateInventoryUI("Nothing to pick up here.");
      return;
    }
    holdToken = state.tokenValue;
    state.tokenValue = 0;
    setTokenLabel(label, state.tokenValue);
    updateInventoryUI(`Picked up ${holdToken}.`);
    return;
  }

  // case: holding a token already -> place on cell if EMPTY
  if (state.tokenValue === 0) {
    state.tokenValue = holdToken;
    holdToken = null;
    setTokenLabel(label, state.tokenValue);
    updateInventoryUI(`Placed down ${state.tokenValue}.`);
    return;
  }

  // case: craft token (combine held token with ground token if same value)
  if (holdToken === state.tokenValue) {
    state.tokenValue = state.tokenValue * 2;
    holdToken = null;
    setTokenLabel(label, state.tokenValue);
    updateInventoryUI(`Crafted new token: ${state.tokenValue}.`);
    return;
  }

  // block picking up if values differ
  updateInventoryUI(`Cell has ${state.tokenValue}. Need equal to craft.`);
}

// ============================== BUILD CELLS ============================== //
drawGrid();
updateInventoryUI();
