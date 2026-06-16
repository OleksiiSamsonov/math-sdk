# Gold Rush Lines Frontend Prototype

Gold Rush Lines is a 5-reel, 3-row video slot prototype built with React, TypeScript, and Vite.

## Current Version

Frontend version: v0.2

## Features

- 5×3 slot grid
- 20 fixed paylines
- Spin button
- Bet selector
- Balance display
- Last win display
- Paytable section
- Winning cell highlights
- Win banner
- Spin history
- Reset balance button
- Responsive layout

## Current Limitations

- Local prototype only
- Uses temporary frontend-side random symbol generation
- Not connected to Stake Engine RGS
- Not using production game outcome files yet
- Emoji placeholders are used instead of final art assets
- Free Spins are disabled

## Math Reference

The current math version is stored in:

../games/gold_rush_lines/

The current game rules are stored in:

../games/gold_rush_lines/game_rules.md

## Development

Install dependencies:

npm install

Run local dev server:

npm run dev

Build production version:

npm run build