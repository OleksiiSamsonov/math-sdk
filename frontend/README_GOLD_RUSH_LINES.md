# Gold Rush Lines Frontend Prototype

Gold Rush Lines is a 5-reel, 3-row video slot prototype built with React, TypeScript, and Vite.

This frontend is a local prototype for testing the game presentation, spin flow, win display, and UI behavior before connecting to a real RGS/backend system.

## Current Version

Frontend version: v0.4

## Current Architecture

```text
App.tsx
  ↓
mockApi.ts
  ↓
gameEngine.ts
````

### App.tsx

Handles the user interface and gameplay flow:

* Balance display
* Bet selector
* Spin button
* Win banner
* Winning cell highlights
* Spin history
* Paytable display
* API error display

### mockApi.ts

Imitates a backend/API layer:

* Receives a spin request
* Validates bet and balance
* Adds mock latency
* Calls the local game engine
* Returns a spin response

### gameEngine.ts

Contains local game logic:

* Symbol definitions
* Paytable
* Weighted reels
* Paylines
* Board generation
* Line evaluation
* Win calculation
* Mock spin result creation

## Features

* 5×3 slot grid
* 20 fixed paylines
* Spin button
* Bet selector
* Balance display
* Last win display
* Paytable section
* Winning cell highlights
* Win banner
* Spin history
* Reset balance button
* Mock API spin flow
* API error display
* Responsive layout
* Production build passes

## Current Limitations

* Local prototype only
* Uses temporary frontend-side mock API
* Not connected to Stake Engine RGS
* Not using production game outcome files yet
* Emoji placeholders are used instead of final art assets
* Free Spins are disabled
* No real wallet/session integration
* No real backend yet

## Math Reference

The current math version is stored in:

```text
../games/gold_rush_lines/
```

The current game rules are stored in:

```text
../games/gold_rush_lines/game_rules.md
```

Current math status:

* Base game only
* 5 reels × 3 rows
* 20 paylines
* Wild enabled
* FreeGame disabled
* RTP tested around 94–95%

## Development

Install dependencies:

```bash
npm install
```

Run local dev server:

```bash
npm run dev
```

Build production version:

```bash
npm run build
```

## Next Planned Step

Create a real local mock backend so the frontend spin flow becomes:

```text
Frontend
  ↓ HTTP request
Local backend API
  ↓
Game engine / spin result
  ↓
Frontend display
```

This will make the prototype closer to a real casino game architecture where the frontend does not decide the outcome directly.

````