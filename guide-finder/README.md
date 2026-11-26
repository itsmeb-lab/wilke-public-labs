# Community guide finder

The page uses the existing public comparison catalogs. It includes ordinary guide and task links in the static HTML and adds in-browser lookup when its local modules load. Entering a query does not send it anywhere. Results link to the exact named service and retain its published or unconfirmed state.

Run `node scripts/update-guide-finder.mjs --write` after modifying a guide. Check with `--check`. The projection refuses new task or region identifiers until its reader-facing terms have been supplied.
