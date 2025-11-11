# D3: World of Bits

## Game Design Vision

A geolocation based token collection game, inspired by Pokemon Go and 4096/Threes. The Earth is divided into rectilinear grid. Each cell may contain at most one token. Players can see all cells on the current map view but can only interact with nearby cells. Players can hold at most one token at a time, collect from nearby cells, and combine two tokens of the same value to craft the next higher value. Players start with 1 token and have collect enough tokens to craft a token with the value of 256 to win.

## Technologies

- TypeScript for most game code, little to no explicit HTML, and all CSS collected in common `style.css` file
- Deno and Vite for building
- GitHub Actions + GitHub Pages for deployment automation

## Assignments

### D3.a: Core mechanics (token collection and crafting)

Key technical challenge: Assemble a map-based user interface using the Leaflet mapping framework.
Key gameplay challenge: Players tokens collection and crafting system. Can players craft an even higher value token by moving to other locations to get access to additional crafting materials?

#### Steps

- [x] copy main.ts to reference.ts for future reference
- [x] delete everything in main.ts
- [x] put a basic leaflet map on the screen
- [x] draw the player's location on the map
- [ ] draw a rectangle representing one cell on the map
- [ ] implement grid index and convet lat/lng to cell sizes
- [ ] use loops to draw a whole grid of cells on the map
- [ ] implment cell render system (cells cover current map bounds)
- [ ] add token spawns to cells
- [ ] add player and cell tokens interaction
- [ ] implement interaction rule (can only interact with nearby cells)

### D3.b: Globe-spanning Gameplay

...

### 
