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
const WIN_CONDITION = 128;

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

const wButton = document.createElement("button");
wButton.innerHTML = "West";
wButton.id = "buttons";
document.body.append(wButton);

const eButton = document.createElement("button");
eButton.innerHTML = "East";
eButton.id = "buttons";
document.body.append(eButton);

const inventoryDiv = document.createElement("div");
inventoryDiv.id = "inventory";
document.body.append(inventoryDiv);

// for testing gps and status readout
const gpsDiv = document.createElement("div");
gpsDiv.id = "gps-status";
gpsDiv.textContent = "GPS: idle";
document.body.append(gpsDiv);

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

// ============================== FLYWEIGHT AND MEMENTO ============================== //
// Flyweight holds only the coords and display objects
type FlyweightCellLayer = {
  index: GridIndexes; // intrrinsic
  cell: leaflet.Rectangle; // extrinsic
  label: leaflet.Marker | null; // extrinsic
};

// Map to track what layer a cell was rendered in using its id
const mapLayers = new Map<CellId, FlyweightCellLayer>();

// Memento to store just the cell's current val when MODIFIED
type CellMemento = { value: number };

// Memento caretaker that stores MODIFIED cells
const CellMementoStore = new Map<CellId, CellMemento>();

function getBaseVal(atIndex: GridIndexes) {
  const spawns = luck([atIndex.i, atIndex.j].toString()) < TOKEN_SPAWN_PROB;
  if (!spawns) return 0;
  const val = luck(`${atIndex.i},${atIndex.j}:value`);
  return val < 0.5 ? 2 : 4;
}

// Memento originator to read current val of a cell
function getCellValue(atIndex: GridIndexes): number {
  const m = CellMementoStore.get([atIndex.i, atIndex.j].toString());
  return m ? m.value : getBaseVal(atIndex);
}

// Memento originator writes to caretaker to store if val is different from base (has been altered)
function setCellValue(atIndex: GridIndexes, val: number) {
  const id = [atIndex.i, atIndex.j].toString();
  const baseVal = getBaseVal(atIndex);
  if (val === baseVal) {
    CellMementoStore.delete(id);
  } else {
    CellMementoStore.set(id, { value: val });
  }
}

// ============================== MAP GRID ============================== //
type CellId = string;
type GridIndexes = { i: number; j: number };

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

// ============================== TOKEN SYSTEM ============================== //

function tokenIcon(value: number) {
  return leaflet.divIcon({
    className: "token-text",
    html: value > 0 ? `<span class="token-pill">${value}</span>` : "",
  });
}

function setTokenLabel(layer: FlyweightCellLayer, value: number) {
  const center = cellBounds(layer.index).getCenter();
  if (value > 0) {
    if (!layer.label) {
      layer.label = leaflet.marker(center, {
        interactive: false,
        icon: tokenIcon(value),
      }).addTo(map);
    } else {
      layer.label.setLatLng(center);
      layer.label.setIcon(tokenIcon(value));
    }
  } else {
    if (layer.label) {
      layer.label.remove();
      layer.label = null;
    }
  }
}

// ============================== RENDER MAP ============================== //
// redraw grid when map is moved
map.on("moveend", drawGrid);

function drawGrid() {
  const bounds = map.getBounds();
  const swCell = latLngToCell(bounds.getSouth(), bounds.getWest());
  const neCell = latLngToCell(bounds.getNorth(), bounds.getEast());

  // track which cells have already been drawn
  const seen = new Set<CellId>();

  for (let i = swCell.i; i <= neCell.i; i++) {
    for (let j = swCell.j; j <= neCell.j; j++) {
      const atIndex = { i, j };

      if (getBaseVal(atIndex) > 0 || CellMementoStore.has(`${i},${j}`)) {
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
  const bounds = cellBounds(atIndex);
  const center = bounds.getCenter();

  let layer = mapLayers.get(id);

  // only draw cells if not already drawn
  if (!layer) {
    const cell = leaflet.rectangle(cellBounds(atIndex), {
      weight: 1,
      color: nearby ? "#2987dfff" : "#2f2b50ff",
    });
    cell.addTo(map);

    const labelVal = getCellValue(atIndex);
    const label = labelVal > 0
      ? leaflet.marker(center, {
        interactive: false,
        icon: tokenIcon(labelVal),
      }).addTo(map)
      : null;

    // store in map layers
    layer = { index: atIndex, cell, label };
    mapLayers.set(id, layer);

    // token "pick up" handler
    cell.on("click", () => cellClickHandler(layer!));
  } else {
    // Update style/position of in range cells when on screen
    layer.cell.setBounds(bounds);
    layer.cell.setStyle({ color: nearby ? "#2987dfff" : "#2f2b50ff" });
    if (layer.label) layer.label.setLatLng(center);

    // update token labels
    const cur = getCellValue(atIndex);
    if (cur > 0) {
      if (!layer.label) {
        layer.label = leaflet.marker(center, {
          interactive: false,
          icon: tokenIcon(cur),
        }).addTo(map);
      } else {
        layer.label.setLatLng(center);
        layer.label.setIcon(tokenIcon(cur));
      }
    } else if (layer.label) {
      layer.label.remove();
      layer.label = null;
    }
  }
}

function removeCell(id: CellId) {
  const layer = mapLayers.get(id);
  if (!layer) return;
  layer.cell.remove();
  if (layer.label) layer.label.remove();
  mapLayers.delete(id);
}

// ============================== GEOLOCATION SYSTEM ============================== //
type GeoState = {
  playerID: number | null;
  lastCell: GridIndexes | null;
  hadFix: boolean;
};

const playerGeo: GeoState = { playerID: null, lastCell: null, hadFix: false };

/*
watches and updates player location
navigator.geolocation.watchPosition(success, error);
^ parameters are functions
*/

function getGeolocation() {
  if (!("geolocation" in navigator)) {
    gpsDiv.textContent = "GPS: not supported -> using button movement.";
    return;
  }

  gpsDiv.textContent = "GPS: requesting permission…";

  playerGeo.playerID = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      const nowCell = latLngToCell(latitude, longitude);

      // update gps status text on screen
      gpsDiv.textContent = `GPS: fix (±${Math.round(accuracy)}m) at ( ${
        latitude.toFixed(5)
      }, ${longitude.toFixed(5)} ) --- cell ( ${nowCell.i}, ${nowCell.j} )`;

      if (!playerGeo.hadFix) {
        playerGeo.hadFix = true;
        playerGeo.lastCell = nowCell;
        setPlayerCell(nowCell);
        return;
      }

      // update the player cell if move to new cell
      if (
        !playerGeo.lastCell || nowCell.i !== playerGeo.lastCell.i ||
        nowCell.j !== playerGeo.lastCell.j
      ) {
        playerGeo.lastCell = nowCell;
        setPlayerCell(nowCell);
      }
    },
    (err) => {
      gpsDiv.textContent =
        `GPS: error (${err.code}) ${err.message} -> using button movement)`;
    },
    {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 10000,
    },
  );
}

// ============================== PLAYER SYSTEM ============================== //

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

function setPlayerCell(atIndex: GridIndexes) {
  playerCell = atIndex;
  playerLocation = cellBounds(playerCell).getCenter();
  playerMarker.setLatLng(playerLocation);
  map.panTo(playerLocation);
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

function commitCellChange(
  layer: FlyweightCellLayer,
  index: GridIndexes,
  newCellVal: number,
  newHoldToken: number | null,
  message: string,
) {
  setCellValue(index, newCellVal);
  setTokenLabel(layer, newCellVal);
  holdToken = newHoldToken;
  updateInventoryUI(message);
}

function cellClickHandler(layer: FlyweightCellLayer) {
  const index = layer.index;

  if (!isInRange(index)) {
    layer.cell.bindTooltip("Too far!").openTooltip();
    return;
  }

  const cur = getCellValue(index);

  // case: not holding anything -> pick up token
  if (holdToken == null) {
    if (cur == 0) {
      updateInventoryUI("Nothing to pick up here.");
      return;
    }
    commitCellChange(layer, index, 0, cur, `Picked up ${cur}`);
    return;
  }

  // case: holding a token already -> place on cell if EMPTY
  if (cur === 0) {
    commitCellChange(
      layer,
      index,
      holdToken!,
      null,
      `Placed down ${holdToken}.`,
    );
    return;
  }

  // case: craft token (combine held token with ground token if same value)
  if (holdToken === cur) {
    const craftedToken = cur * 2;
    commitCellChange(
      layer,
      index,
      craftedToken,
      null,
      `Crafted new token: ${craftedToken}`,
    );
    return;
  }

  // block picking up if values differ
  updateInventoryUI(`Cell has ${cur}. Need equal to craft.`);
}

// ============================== ON GAME START UP ============================== //
getGeolocation();
drawGrid();
updateInventoryUI();
