# D2 starter

D2 Drawing Project

A small browser drawing app built with TypeScript and an HTML canvas. You can draw with markers, place stickers, make your own stickers, undo and redo, and export your drawing as a high resolution PNG.

How to use it:

1. Pick a tool under Drawing Tools. The selected tool is outlined in blue.
   Markers (Normal, Thin, Thick): press and drag on the canvas to draw.
   Stickers (Smily Face, Dinosaur, Star, and any you create): click on the canvas to place one.
2. Cancel a stroke by pressing Esc before you let go. The stroke is discarded and nothing is added to your history.
3. Make a custom sticker under Create a custom sticker. Enter a name and an emoji or short text, then press Create Sticker. It appears in the tool list alongside the presets. Both fields are required; if either is empty, nothing is created.
4. Undo / Redo step back and forward through completed strokes and sticker placements. Each button is greyed out when there is nothing to undo or redo. Drawing something new after undoing discards the undone steps.
5. Clear erases the whole drawing and the undo/redo history. It asks for confirmation first, because it cannot be undone.
6. Export PNG downloads myDrawing.png at 1600×1200, twice the canvas size. The export has a white background to match what you see on screen. Strokes still in progress are not included.
7. Redraw is a developer check. It wipes the canvas pixels, waits half a second, and rebuilds the picture from the saved drawing data. Nothing is deleted.

## Credits

Tooling adapted from the [CMPM 121 Fall 2026 D1 starter](https://github.com/ucsc-cmpm-121-f26/d1-starter/tree/d949e744b0f9fb7c133a5316f86f2b7fe54529ad), derived from the [S01 starter](https://github.com/ucsc-cmpm-121-f26/s01-starter/tree/8974888efb6537be82e8eb069db139ea885039da). Those repositories have no explicit repository license; no new license is assigned to that material. The D2 scaffold was authored with OpenCode/OpenAI GPT-6.1 Sol assistance. Dependencies retain their respective licenses.
