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

- [x] add buttons for player movement
- [x] implement player movement in N, S, E, W directions
- [x] anchor map grid at Null Island
- [x] update marker to follow player position
- [x] introduce type alias for modeling grid cells and layers
- [x] get bounds of map viewport
- [x] implement functions that converts i/j cell index to lat/lng
- [x] render grid only in map view
- [x] hook rendering to map interaction/location change
- [x] track cells that are on/off current map view
- [x] implement logic to remove cells that are not in currnet view
- [x] fix player marker (to be in center of cells instead of on a corner)
- [x] update cell interaction rule to follow player position as they move
- [x] "forget" off screen cell states
- [x] re-entering a cell view resets to initial cell value
- [x] refactor map grid code
- [x] refactor click handler code
- [x] raise win condition value

### D3.c

Key technical challenge: Separate a cell's procedurally generated state from player made changes and preserve the state of modified cells by using Flyweight pattern.
Key gameplay challenge: If a player changes a cell (by picking up, moving, or crafting tokens) that state should persist even if it is reloaded by using the Memento pattern.

#### Steps

- [x] implement Flyweight pattern
- [x] define Memento for Memento pattern implementation
- [x] define Caretaker
- [x] define Originator
- [x] route player cell interactions to Memento
- [x] delete any no longer used code
- [x] refactor

### D3.d: Gameplay Across Real-world Space and Time

Key technical challenge: Modify system to use real world geolocation. New player movement system is hidden by using Facade design pattern. Software can persist game state when closed to resume session by using browser localStorage API.
Key gameplay challenge: Player can move their character by moving their device around in the real world. Game state saves accross gameplay sessions and there is a way to start a new game. Game allows for switching between button and geolocation game movement.

#### Steps

- [x] implement browser geolocation API for location based movements
- [] implement new player movement control system using the Facade design pattern
- [] add buttons to toggle between geolocation and button gameplay movement
- [] integrate browser localStorage API for game state to persist across page loads
- [] add buttons to start new game
  ...
- [] make some game tweaks
  - [] add "WASD" and arrow keys as input for button movement move
  - [] move viewport with movement
  - [] fill entire screen with grid
  - [] move default player location to classroom
- [] clean up and refactor code
- [] clean up and reformat PLAN.md
