# Another Quick Switcher

An Obsidian plugin offering customizable search dialogs as an alternative to the built-in Quick Switcher. Terminology follows the upstream project (tadashi-aikawa/obsidian-another-quick-switcher) wherever it has an established name.

## Language

### Querying

**Search query**:
The full input string typed into a dialog.
_Avoid_: Input, search string

**Query**:
One whitespace-separated unit of the search query, matched independently of the others (token-order-independent matching).
_Avoid_: Query term, token (reserved for file-name fragments), keyword

**Tag query**:
A query starting with `#` that matches against a file's tags.

**Property query**:
A query of the form `@key:value` that matches against a file's frontmatter properties; `@key:` alone matches files where the property exists.

**Exclude query**:
A query starting with the exclude prefix (default `-`) that removes matching items from results.
_Avoid_: Negative query, negation

**Token**:
A whitespace-separated fragment of a file name or alias, used for perfect-word matching.
_Avoid_: Query (a token belongs to a name, not to the search query), word

### Search configuration

**Search command**:
A single user-configured search definition: a name plus a search target, sort priorities, search options, and an optional hotkey.
_Avoid_: Custom search (singular), search config

**Custom searches**:
The feature (and settings section) that holds the user's list of search commands.
_Avoid_: Search commands settings

**Search target**:
The scope a search command searches over: `file`, `opened file`, `backlink`, `link`, or `2-hop-link`.
_Avoid_: Search scope, source

**Sort priority**:
One ranking criterion in a search command's ordered list; results are compared by each priority in turn. Custom priorities exist for tags (`#tag`), extensions (`.md`), and properties (`@key:asc|desc`).
_Avoid_: Sort order (that is the asc/desc direction of a property priority), ranking rule

**Origin file**:
The file that was active when a dialog was opened. Backlink, link, and 2-hop-link searches are relative to it, even after preview or navigation changes the active file.
_Avoid_: Current file, active file

**Backlink**:
A file that links to the origin file.
_Avoid_: Back link, incoming link

**2-hop link**:
A file reachable from the origin file through one intermediate link (origin → B → C).
_Avoid_: Two-hop link, second-degree link

**Switch**:
An explicit choice of a suggestion in one of this plugin's dialogs that opens a file. Previews, auto previews, and opens made outside the plugin are not switches.
_Avoid_: Open (broader), visit, navigation

**Frequency window**:
The configurable recent period within which switches count toward a file's switch frequency.

**Frequently opened**:
A sort priority that ranks files by their number of switches within the frequency window.
_Avoid_: Frecency, most used, popular

### Results

**Suggestion**:
An entry in a dialog's result list, backed by a file, phantom, header, folder, or command.
_Avoid_: Suggestion item, result, candidate

**Phantom**:
A file that does not exist in the vault but appears in suggestions because a link points to it.
_Avoid_: Virtual file, unresolved link target

**Selected**:
The single item currently highlighted under the cursor in a suggestion list.
_Avoid_: Active, focused, checked

**Checked**:
An item the user has marked via check/uncheck hotkeys for batch operations (open, insert, close).
_Avoid_: Selected (reserved for the cursor highlight), multi-selected

### Dialogs

**Dialog**:
A search window opened by the plugin (main search, Grep, Header, Backlink, Link, In-file, Folder, Move, Command palette).
_Avoid_: Modal (Obsidian API implementation term), popup, window

**Dialog command**:
A hotkey-bindable action available while a dialog is open (e.g. open in new tab, check/uncheck, navigate links).
_Avoid_: Dialog action, hotkey action, modal command

**Floating**:
A dialog mode where the dialog overlays the editor without hiding it, so the note remains visible and scrollable while searching.
_Avoid_: Overlay mode, popover

**Auto preview**:
Behavior where the selected suggestion is previewed in the editor automatically as the cursor moves, without closing the dialog.
_Avoid_: Live preview (Obsidian editor mode)

**Navigation history**:
The in-dialog stack of previously executed search commands and queries, traversable with back/forward dialog commands.
_Avoid_: Search history, breadcrumbs

**Relative updated period**:
The human-readable age (e.g. "2 days ago") shown on a suggestion, derived from modified/created time or a configured property.
_Avoid_: Age, timestamp display
