# Soul Online alpha 1.10 - Field UI / Orientation / Hunting Fix

## Goal

This patch prioritizes the problems reported during live mobile testing:

- Do not force rotate the device or show portrait-only guard messages.
- Keep the opening screen as a clean artwork + start button screen.
- Reduce chaotic town palette into parchment/aqua/gold.
- Remove minimap and field resource strip from the hunting HUD.
- Place monster target card centered directly below the player HUD.
- Fill the empty field profile portrait with class/gender portraits.
- Stop lower-right menu/attack/utility button overlap.
- Increase field density and combat pressure.
- Make auto-hunt travel between pockets instead of circling in place.

## Notes

The browser may still rotate the page when the physical device is rotated, but the game no longer calls `screen.orientation.lock()` and no longer displays a portrait warning overlay. It follows the mode the player opened or rotated into, then reflows the field UI.
