---
name: design-dashboard
description: Build a branded, live Bark dashboard in Claude Cowork. Use when the user asks to build, create, make, or set up a Bark dashboard or board for their store — copies the bundled HTML template, sets the header, and publishes it as a live artifact.
---

# Design a Bark dashboard (Cowork live artifact)

Build a branded Bark dashboard by **copying the bundled HTML template** and publishing it as a Cowork
live artifact. This is the placeholder/MVP flow — copy the template, set the header, publish. (The
data-driven catalog + spec renderer comes later; for now the template is the whole board.)

## When this applies

Only when the user asks to **build / create / make / set up a Bark dashboard** (a board / live view)
for their store. A question about the business is not a dashboard request — answer that directly.

## Prerequisite: confirm you're in Cowork

This skill needs Cowork's live-artifact tools. Check that `create_artifact` is available before
starting; if it isn't, say the dashboard builder only works in a Claude Cowork session and stop.

## Steps

1. **Copy the template into the working folder.** The template ships with this skill at
   `${CLAUDE_PLUGIN_ROOT}/skills/design-dashboard/templates/dashboard.html`. Copy it into the working
   directory as a new file (e.g. `dashboard.html`) — **do not edit it in place inside the plugin.**
2. **Set the header text.** In the copied file, replace the two placeholders:
   - `{{STORE_NAME}}` → the store's official name (e.g. "Acme Hats").
   - `{{BOARD_LABEL}}` → a short board label (e.g. "Profit & Loss", "Category Analysis").
   Leave the rest of the file as-is for now.
3. **Publish as a live artifact.** Call `create_artifact` pointing at the copied file.
   - **Name:** `Bark · <Board> — <Store>` (store name at the end) — e.g. "Bark · P&L — Acme Hats".
   - **id:** a stable kebab-case slug of the board then the store, `&` → `n`/`and`, e.g.
     `profit-loss-acme-hats`. Reuse the same id when updating an existing board.
4. **Tell the user it's live** in one line — no need to paste the file back into chat.

## To modify an existing board

Find the artifact by its stable id, copy/read that file, edit it, and `update_artifact` with the
**same id** — don't spawn a new one.

## Notes

- Keep the plugin's template file pristine — always work on the copy.
- This is a starting point: the template is a branded shell. Richer, data-bound dashboards are added
  by extending the template, not by regenerating HTML per request.
