# D3: World of Bits

## Game Design Vision

A geolocation based token collection game, inspired by Pokemon Go and 4096/Threes. The Earth is divided into rectilinear grid. Each cell may contain at most one token. Players can see all cells on the current map view but can only interact with nearby cells. Players can hold at most one token at a time, collect from nearby cells, and combine two tokens of the same value to craft the next higher value. Players start with 1 token and have collect enough tokens to craft a token with the value of 16 (will be changed) to win.

## Technologies

- TypeScript for most game code, little to no explicit HTML, and all CSS collected in common `style.css` file
- Deno and Vite for building
- GitHub Actions + GitHub Pages for deployment automation

## Assignments

### D3.a: Core mechanics (token collection and crafting)

Key technical challenge: Assemble a map-based user interface using the Leaflet mapping framework.
Key gameplay challenge: Player tokens collection and crafting system. Can players craft an even higher value token by moving to other locations to get access to additional crafting materials?

#### Steps

- [x] copy main.ts to reference.ts for future reference
- [x] delete everything in main.ts
- [x] put a basic leaflet map on the screen
- [x] draw the player's location on the map
- [x] draw a rectangle representing one cell on the map
- [x] implement grid index and convet lat/lng to cell sizes
- [x] use loops to draw a whole grid of cells on the map
- [x] add token spawns to cells
- [x] implement token spawn logic (using _luck.ts)
- [x] add token label/icon
- [x] make cells clickable and update cell labels
- [x] implement interaction rule (can only interact with nearby cells)
- [x] make inventory HUD
- [x] update inventory when a token is picked up
- [x] implement inventory constraint: can only hold 1 token
- [x] handle click on EMPTY cells to place held token
- [x] handle click on same value cells to craft higher token
- [x] implement win condition
- [x] refactor code

### D3.b: Globe-spanning Gameplay

Key technical challenge: Allow player movement over grid with a global grid anchored rendering system. Grid should spawn/despawn based on viewport.
Key gameplay challenge: Free map panning system also restricting cell interaction to player's location on map. Higher merge value and win condition threshold.

#### Steps

- [ ] add buttons for player movement
- [ ] implement player movement in N, S, E, W directions
- [ ] update marker to follow player position
- [ ] update cell interaction rule to follow player position
- [ ] anchor map grid at Null Island
- [ ] introduce new data type for modeling grid cells?
- [ ]
  ...
- [ ] raise win condition value
