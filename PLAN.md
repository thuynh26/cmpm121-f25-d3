# D3: World of Bits

## Game Design Vision

A geolocation based token collection game, inspired by Pokemon Go and 4096/Threes. The world is a rectilinear grid. Players can see all cells globally but may only interact with cells near them. Players can hold at most one token at a time, collect from nearby cells, and combine two tokens of the same value to craft the next higher value. Players start with 1 token and have collect enough tokens to craft a token with the value of 256 to win.

## Technologies

- TypeScript for most game code, little to no explicit HTML, and all CSS collected in common `style.css` file
- Deno and Vite for building
- GitHub Actions + GitHub Pages for deployment automation

## Assignments

### D3.a: Core mechanics (token collection and crafting)

Key technical challenge: Can you assemble a map-based user interface using the Leaflet mapping framework?
Key gameplay challenge: Can players collect and craft tokens from nearby locations to finally make one of sufficiently high value?

#### Steps

- [x] copy main.ts to reference.ts for future reference
- [ ] delete everything in main.ts
- [ ] put a basic leaflet map on the screen
- [ ] draw the player's location on the map
- [ ] draw a rectangle representing one cell on the map
- [ ] use loops to draw a whole grid of cells on the map
- ...

### D3.b: Globe-spanning Gameplay

...

### 
