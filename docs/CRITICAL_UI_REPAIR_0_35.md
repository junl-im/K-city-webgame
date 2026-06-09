# 0.35 Critical UI Repair

Focus: stop the UI regression before adding more content.

- Restored `position: fixed` and hidden/open transforms for field sheet windows.
- Restored `position: fixed` for the town drawer; hidden drawers no longer sit in layout or block clicks.
- Reduced town HUD, cards, zone list, bottom buttons, and quick actions to a compact scale.
- Disabled pointer events on town backdrop/diorama art so it cannot intercept menu buttons.
- Forced field-only HUD elements to stay hidden in town.
- Removed the minimap from all active layouts.
- Added a real character profile/stat card to the town account drawer.
- Closed any open field sheet when entering a hunting zone.
