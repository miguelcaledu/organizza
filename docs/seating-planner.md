# Wedding floor plan & seating planner

A tool for laying out a wedding reception room to scale and seating every guest. Organizza staff (the "masters") create and control every plan. Each couple signs in to work on their own plan.

## Who can do what

| | Staff (admin / employee) | Couple (client account) | Read-only link |
| --- | --- | --- | --- |
| Where | **Plantas** in the staff app (`/plantas`), then `/plano/p/<id>` | `/plano` login, then their plan | `/plano/v/<token>` |
| Room shape, doors, furniture (add/move/resize/delete) | ✓ | — | — |
| Guests: add, rename, remove, seat | ✓ | ✓ | — |
| Number of seats per table | ✓ | ✓ (up to the table's maximum) | — |
| See the change log and colours | ✓ | — | — |
| Print / PDF | ✓ | ✓ | ✓ |

- **Accounts:** staff create a plan in **Plantas → + Novo plano** and enter the couple's email. Supabase emails them an invite. The couple sets a password at `/plano/definir-password` and from then on signs in at `/plano`. "Reenviar acesso" sends a fresh set-password link, and "Esqueci-me da palavra-passe" on the login page does the same.
- **Couples can't bypass the rules.** They have no database write access to `seating_plans`. Their saves go through `PUT /api/plans/<id>`, which keeps the stored layout, takes only the guests and per-table seat counts from their copy, and logs every difference before writing.
- **Change log and colours:** every change a couple makes is recorded in `seating_plan_changes`. On the plan, the staff view shows unreviewed changes as:
  - 🟡 **yellow**: a person was changed (renamed, moved, or their group or note edited)
  - 🔵 **blue**: a person was added
  - 🔴 **red**: a seat was added
  - removed people or seats appear only in the log, in grey

  "Marcar como visto" in the plan's **Alterações** tab clears the colours. The Plantas dashboard shows the number of changes awaiting review for each plan, plus a feed of recent activity across all plans.

- **Deleting plans:** "Eliminar" asks for confirmation, then moves the plan to **Plantas → Lixo**. While it's there, the couple can't see it and its read-only link stops working. Staff can **restore** it, or **delete it permanently** with a second confirmation. After 30 days it's purged automatically, together with its change log. A daily `pg_cron` job does this, and Plantas also purges whenever it loads, as a fallback if `pg_cron` isn't enabled.

## Spaces (Cocktail, Jantar, …)

A plan can have several **spaces**, shown as tabs above the plan. Each one has its own room shape, doors and furniture, for example Cocktail, Cerimónia, Jantar or Festa.
- **Guests are shared** across all spaces and can be seated at a table in any space. Table numbers run across the whole plan (Mesa 1…N), and seat pickers and table lists show which space a table is in.
- **Staff** add a space with **+ Espaço**: pick a suggested name or "Outro…". A new space starts as a 15 × 10 m room with one door. On the active tab, staff can rename a space (✎ or double-click), move it left or right (‹ ›), or delete it (🗑). Deleting asks for confirmation, removes the space's room and furniture, and unseats any guests sitting there; ⌘Z undoes it.
- **Couples** can switch between spaces but can't add, rename or delete them.
- **Printing** gives one floor-plan page per space, followed by the seat lists.
- **Older plans** (single room) are upgraded automatically when they're loaded: their room becomes a space called "Sala".

## Material details & folha de obra (staff only)

- **Defaults** are set in the **Material** tab and apply to every dining table:
  - tablecloth drop (to the floor / short 30 cm / none) and colour
  - napkin colour, chair model and chair-cover colour (empty = no covers)
  - centerpiece and table-number card (yes/no)

  Bars, buffets, the DJ table and the cake table have their own tablecloth default.
- **Per item:** the **Detalhes e material** section in the Element tab overrides any of those fields for one table, and empty fields keep the default, shown as greyed-out hint text. Every item, including sofas and the stage, can carry a set-up note. **Repor padrão** clears one table's overrides; **Aplicar a todas** in the Material tab clears them for all tables, keeping the notes.
- **Automatic count:** tables by type, chairs by model, tablecloths by size and colour, napkins and chair covers by colour, centerpieces, table numbers, and every other item with its size. There's a configurable **spare margin** (default 10% napkins, 0% tablecloths and chairs). The count is shown live in the Material tab and as a printable **folha de obra** (`/plano/p/<id>/folha-de-obra`): an overall summary, a breakdown per space, a table-by-table checklist and the set-up notes. It can also be exported as a **CSV** (semicolon-separated, opens directly in Excel).
- **Tablecloth size** = table size + 2 × drop, rounded up to the next 10 cm. The drop is 76 cm to the floor for dining, buffet, DJ and cake tables, 110 cm for bars, and 30 cm for a short drop. For example: Ø180 → Ø3,40 m; Ø160 → Ø3,20 m; 250 × 100 → 4,10 × 2,60 m.
- Couples and the read-only link don't see any of this, and couples' saves can't change it.

## Using the editor

- **Room tab:** rectangular or L-shaped presets, width and length in metres (other shapes are stretched to match), corners edited by dragging or by typing X/Y, a **+** at each wall to add a corner, double-click a corner to remove it, and doors that can be dragged along the walls or set numerically.
- **Furniture palette (left):** click to add an item. It is placed at the centre of the view, in the nearest free spot. You can drag to move, use the round handle to rotate (15° steps when snapping is on), and use the square handle to resize spaces (dance floor, bar and so on). Duplicate and delete are in the Element tab.
- **Guests tab** (staff and couples): add one name, or paste a list with one name per line. To seat a guest, drag the ⋮⋮ handle onto a chair, tap a name and then a chair, or use the "Lugar" dropdown. Tables also get a per-seat dropdown in the Element tab.
- **Warnings tab:** lists overlaps, items outside the room and blocked doors. Affected items are outlined in terracotta on the plan.
- **Print / PDF:** uses the browser's print dialog ("Guardar como PDF"). The output is an A4 landscape plan drawn to scale, followed by the seat list for every table and an alphabetical guest index.
- **Phones (< 768 px):** full editing by touch. Drag tables, the dance floor, bar, buffet or DJ table from the strip under the plan (or tap one to add it to a free spot). Move items with one finger, pan with a finger on empty floor, and pinch to zoom. The selected item gets a bar with rotate, duplicate, delete and **Ajustar** (name, table size, rectangular-table width, seats, dimensions, rotation, seat assignments). The **Sala** tab sets room dimensions, corners and doors numerically; drawing the room by dragging corners needs a tablet or computer. Handles are enlarged on touch screens.
- **Drag handles:** round = rotate; square corner = resize spaces (dance floor, bar, buffet, DJ); bar on the edge of a rectangular table = its width (60–150 cm; the 250 cm length is fixed). Round tables keep their Ø160 / Ø180 sizes; switch between them under "Tipo de mesa".
- **Keyboard:** ⌘Z / ⇧⌘Z undo/redo, R / ⇧R rotate ±15°, ⌘D duplicate, Delete removes, arrows nudge (⇧ ×10), Esc deselects. ⌘/Ctrl + scroll (or trackpad pinch) zooms; plain scroll pans.

## Assumptions (please review)

### Furniture dimensions & seating capacity

Dining tables are limited to the three sizes in the brief. Where the brief didn't give a figure, these are the defaults, defined in [`src/lib/seating/catalog.ts`](../src/lib/seating/catalog.ts):

| Item | Size | Default seats | Max seats | Notes |
| --- | --- | --- | --- | --- |
| Round table | Ø 160 cm (fixed) | 8 | 10 | ~63 cm of edge per guest at 8 |
| Round table | Ø 180 cm (fixed) | 10 | 12 | ~57 cm per guest at 10 |
| Rectangular table | 250 cm long (fixed) × **100 cm** wide (60–150 editable) | 8 | 12 | 5 per long side max (50 cm each), then one at each end; "1 lado" mode = max 5, for a head/sweetheart table |
| Dance floor | 600 × 500 cm | – | – | editable 2–20 m per side |
| Stage (Palco) | 600 × 300 cm | – | – | editable 1–20 m |
| Photo booth | 300 × 300 cm | – | – | editable 1–10 m |
| Lounge sofa (Sofá) | 200 × 85 cm | – | – | editable 0.6–5 m; backrest drawn on the top edge |
| Armchair (Poltrona) | 85 × 85 cm | – | – | editable 0.5–2 m |
| Plant / flower arrangement (Decoração) | Ø 80 cm | – | – | round, Ø 0.3–4 m |
| Cake table (Bolo) | Ø 90 cm | – | – | round, Ø 0.5–2.5 m |
| Bar | 300 × 70 cm | – | – | editable 0.5–15 m |
| Buffet table | 300 × 80 cm | – | – | editable 0.5–15 m |
| DJ table | 200 × 80 cm | – | – | editable 0.5–6 m |

- **Chairs** are drawn 42 × 40 cm, with their centre 28 cm from the table edge.
- **Clearance for warnings:** each seated side of a table reserves **55 cm** for a pulled-out chair. Two tables only trigger an overlap warning when these chair zones intersect, so back-to-back chairs that just touch are allowed. Tighter aisles (for example the 90–120 cm many venues want for service) are not enforced; the planner can judge those by eye from the 1 m grid.
- **Doors** default to 180 cm wide (double door) for the main entrance and 160 cm for new ones. A **1 m deep zone** inside each door must stay free, otherwise a warning is raised.
- **Seat numbering** runs clockwise. Round tables start at 12 o'clock; rectangular tables start top-left and go along the top, the right end, the bottom (right → left), then the left end.
- **Sample plan:** a 16 × 12 m **Cocktail** space (stage, bar, two lounge corners, photo booth, flower arrangements) plus a 20 × 14 m **Jantar** room with 82 seats (a head table for 2, 4 × Ø180, 4 × Ø160, 1 × rectangular) and 24 guests, 12 of them already seated.

### Product / technical

- **UI language is Portuguese**, matching the rest of Organizza. All strings are inline in `src/components/seating/*`.
- **Only staff create plans.** There is no public sign-up for couples; they are invited. One couple account can hold several plans.
- **Couples' saves merge, staff saves overwrite.** A couple's save never touches the layout. A staff member's save writes the whole plan, so if staff have the plan open while the couple edits guests, the staff save can undo the couple's guest edits. Their change log keeps the record.
- **Autosave** runs about 1 s after the last change and again on tab close. If the session expires, the editor shows "Sessão terminada · entrar" and keeps all changes in the tab.
- **Only couples' changes are logged.** Staff edits are not logged.
- **PDF export uses the browser's "Save as PDF"** rather than a bundled PDF library. This keeps the output vector-sharp and adds no dependencies.
- **Rotation** can be any whole degree. Snapping (5, 10, 25 or 50 cm grid, 15° rotation) is on by default and can be toggled.
- **Limits enforced on save:** 400 items, 1,500 guests, 64 room corners and a 2 MB payload. Values are re-validated and clamped server-side, and duplicate seat assignments are dropped there too.

## Data & storage

- Migrations, in order: [`supabase/seating-plans.sql`](../supabase/seating-plans.sql), [`supabase/client-accounts.sql`](../supabase/client-accounts.sql), [`supabase/plans-trash.sql`](../supabase/plans-trash.sql), then [`supabase/lock-signup.sql`](../supabase/lock-signup.sql) (new accounts start without access). The second one adds the `client` role, makes all staff tables staff-only (before it, any signed-in user could read them), stops users changing their own role, and creates the change log.
- One row per plan in `seating_plans`. The whole plan is a single `jsonb` document whose shape is defined in [`src/lib/seating/types.ts`](../src/lib/seating/types.ts). All lengths are in **centimetres**, with x to the right and y down.
- **RLS:** staff can read and write every plan; a couple can **read** only plans where `client_id` is their user. Couples' writes are done by the server with the service role, after it has filtered and logged them. The read-only link uses the `get_seating_plan(view_token)` RPC, so it needs no account.
- **Supabase Auth settings:** under Authentication → URL Configuration, add `http://localhost:3000/plano/definir-password` and the production equivalent to **Redirect URLs**, otherwise invite links will fail. Supabase's built-in email sender only allows a few emails per hour; set up custom SMTP before inviting real couples.
- `DEV_BYPASS_AUTH=1` (development only) makes a visitor without a session count as staff, using the service role. Couple logins still use their real session.

## Code map

| Path | What |
| --- | --- |
| `src/app/(app)/plantas/` | staff dashboard: plans, invites, activity, review (server actions) |
| `src/app/plano/page.tsx`, `conta/`, `definir-password/` | couple login, account, set password |
| `src/app/plano/p/[id]`, `v/[token]` | editor (logged in) / read-only page |
| `src/app/api/plans/[id]/route.ts` | `PUT` autosave: staff write directly; couple saves are filtered and logged |
| `src/lib/seating/clientEdits.ts` | what couples may change, change diff, colours |
| `src/lib/seating/` | types, catalogue, geometry and warnings, pure plan ops, validation, store |
| `src/components/seating/PlanEditor.tsx` | shell: history, autosave, guest drag, shortcuts, responsive layout |
| `src/components/seating/FloorCanvas.tsx` | pan/zoom/pinch and drag gestures |
| `src/components/seating/PlanDrawing.tsx` | pure SVG renderer (shared by canvas and print) |
| `src/components/seating/Panels.tsx` | room / element / guests / warnings / tables panels |
| `src/components/seating/PrintSheet.tsx` | print-only layout |
