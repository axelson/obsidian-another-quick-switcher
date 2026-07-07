# Count only plugin-chosen opens toward switch frequency

The "Frequently opened" sort priority ranks files by how often they are switched to. We count only explicit chooses of a suggestion in this plugin's dialogs — not opens via Obsidian's file explorer, links, or other plugins. Workspace-wide tracking (hooking the `file-open` event) was rejected because this plugin's auto-preview feature opens files as the cursor moves through suggestions, which would inflate counts for files the user never actually chose; filtering those out would require fiddly suppression logic in shared code, hurting mergeability with upstream (see FORK.md).

## Consequences

- Frequency reflects "files I reach through this switcher", not total note usage. Opens made outside the plugin are invisible to the ranking.
- Changing the event definition later would make accumulated history in users' `switch-history.json` incomparable with new data.
