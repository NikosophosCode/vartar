# Vartar Game - AI Coding Guidelines

## Architecture Overview

**Vartar** is a real-time multiplayer canvas-based game with client-server architecture:
- **Client**: Vanilla JavaScript ES6 classes with HTML5 Canvas rendering
- **Server**: Express.js REST API (`index.js`) managing player state and positions
- **Communication**: Real-time position updates via polling (50ms intervals)

## Key Components

### Client Architecture (`/public/js/`)
- **`Game`** (game.js): Main game controller managing state transitions and canvas rendering
- **`Character`** (character.js): Player/enemy entities with position, movement, and combat powers
- **`APIService`** (apiService.js): Centralized HTTP client with error handling
- **`ErrorHandler`** (errorHandler.js): Comprehensive error logging with localStorage persistence
- **`Config`** (config.js): Centralized configuration for server endpoints, game constants, and UI settings

### Server Architecture (`index.js`)
- **`Jugador`** class: Player state management (position, character, powers)
- **`Personaje`** class: Character data container
- RESTful endpoints: `/users`, `/vartar/:id`, `/vartar/:id/posicion`, `/vartar/:id/poderes`

## Game Flow Patterns

### State Transitions
1. **Character Selection** → **Map Exploration** → **Combat** → **Results**
2. Each state managed by DOM visibility toggling in `Game` class
3. Canvas cleared and redrawn every 50ms during map phase

### Combat System
- Turn-based with simultaneous power selection (6 powers each)
- Rock-paper-scissors mechanics defined in `Config.GAME.POWER_COMBINATIONS.WINNING`
- Victory determined by most winning power combinations

## Development Patterns

### Error Handling Convention
```javascript
// Always wrap async operations
return ErrorHandler.handleAsyncError(
    this.request(endpoint),
    'Operation context'
);

// Log errors with context
ErrorHandler.logError(error, 'Component.method');
```

### Canvas Rendering Pattern
```javascript
// Standard game loop in Game.updateGame()
this.clearCanvas();
this.drawBackground();
this.updatePlayerCharacter();
this.drawEnemies();
```

### API Communication
- All server communication through `APIService` class
- Automatic JSON/text response handling
- Consistent error propagation to `ErrorHandler`

## Critical Development Commands

```bash
# Start server (required for multiplayer)
node index.js

# Client served via static files on http://localhost:3000
# No build process - direct browser execution
```

## Character Asset Conventions

Characters follow strict naming pattern:
- Main image: `./assets/{name}.jpg`
- Mini image: `./assets/{name}mini.webp`
- Names: sinji, kiira, kimo, vera, narobi, nutso, limbre, iroki

## Canvas Integration Points

- **Map dimensions**: Responsive based on `window.innerWidth` with 4:3 aspect ratio
- **Collision detection**: 10px margin defined in `Config.UI.COLLISION_MARGIN`
- **Movement**: Velocity-based with boundary constraints in `Character.move()`

## Server State Management

- Players stored in global `jugadores[]` array
- Position updates broadcast to all other players via `/posicion` endpoint
- No session persistence - server restart resets all state

## Debugging Essentials

- Errors logged to browser console and `localStorage` (key: 'vartar_errors')
- Visual error notifications via `ErrorHandler.showUserError()`
- Server logs enemy positions to console on each update
