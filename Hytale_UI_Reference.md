# UI System Reference | HytaleDocs

> *Source: [Hytale Server Docs (Unofficial)](https://hytale-docs.pages.dev/gui/)*

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [The Three GUI Systems](#2-the-three-gui-systems)
3. [Accessing GUI Managers](#3-accessing-gui-managers)
4. [When to Use Each System](#4-when-to-use-each-system)
5. [Quick Start Examples](#5-quick-start-examples)
6. [UI File System](#6-ui-file-system)
7. [Package References](#7-package-references)
8. [Windows System](#8-windows-system)
   - [Architecture](#81-architecture)
   - [WindowManager](#82-windowmanager)
   - [Window Types](#83-window-types)
   - [Creating Custom Windows](#84-creating-custom-windows)
   - [WindowAction Types](#85-windowaction-types)
   - [Window Events](#86-window-events)
   - [Built-in Window Classes](#87-built-in-window-classes)
   - [Client-Requestable Windows](#88-client-requestable-windows)
   - [Best Practices](#89-best-practices)
9. [Custom Pages System](#9-custom-pages-system)
   - [Architecture](#91-architecture)
   - [PageManager](#92-pagemanager)
   - [CustomUIPage Hierarchy](#93-customuipage-hierarchy)
   - [Event Data Class](#94-event-data-class)
   - [UIEventBuilder](#95-uieventbuilder)
   - [UICommandBuilder](#96-uicommandbuilder)
   - [Complete Interactive Example](#97-complete-interactive-example)
   - [Updating Pages Dynamically](#98-updating-pages-dynamically)
   - [ChoiceBasePage](#99-choicebasepage)
   - [Creating Custom .ui Files](#910-creating-custom-ui-files)
   - [Built-in UI Files](#911-built-in-ui-files)
   - [Best Practices](#912-best-practices)
10. [HUD System](#10-hud-system)
    - [Architecture](#101-architecture)
    - [HudManager](#102-hudmanager)
    - [HudComponent Enum](#103-hudcomponent-enum)
    - [CustomUIHud](#104-customuihud)
    - [Event Titles](#105-event-titles)
    - [Notifications](#106-notifications)
    - [Kill Feed](#107-kill-feed)
    - [Practical Examples](#108-practical-examples)
    - [Best Practices](#109-best-practices)
11. [UI Building Tools](#11-ui-building-tools)
    - [UICommandBuilder](#111-uicommandbuilder)
    - [UIEventBuilder](#112-uieventbuilder)
    - [EventData](#113-eventdata)
    - [Complete Example](#114-complete-example)
    - [UI Markup Syntax](#115-ui-markup-syntax)
    - [Best Practices](#116-best-practices)

---

## 1. Architecture Overview

Hytale's server-side GUI system is composed of three distinct subsystems, each designed for different use cases. All three are managed per-player and accessed through the `Player` component.

```
Player Component
├── WindowManager      - Inventory-based UIs (containers, crafting)
├── PageManager        - Custom dialogs and overlays
├── HudManager         - Persistent on-screen elements
├── HotbarManager      - Player hotbar slot management
└── WorldMapTracker    - World map UI state

Page Classes
├── CustomUIPage            - Base class for custom pages
├── BasicCustomUIPage       - Simple pages without event handling
└── InteractiveCustomUIPage - Pages with typed event data handling

HUD Classes
└── CustomUIHud             - Base class for custom HUD overlays

UI Building Tools
├── UICommandBuilder   - Build UI commands (set values, append elements)
├── UIEventBuilder     - Bind UI events to server callbacks
└── EventData          - Pass parameters with events

UI Assets
├── .ui files          - Text-based layout definitions
├── Common.ui          - Global styles and constants
└── Pages/*.ui         - Page-specific layouts and components
```

---

## 2. The Three GUI Systems

### Windows System

Inventory-based UIs for containers, crafting benches, and processing stations. Windows display item grids and handle player-item interactions.

### Pages System

Custom dialogs, menus, and full-screen overlays. Build fully interactive UIs with event handling for shops, dialogs, and custom interfaces.

### HUD System

Persistent on-screen elements like health bars, hotbar, compass, and custom overlays. Control what information players see during gameplay.

### UI Building Tools

`UICommandBuilder` and `UIEventBuilder` for creating and updating UI elements dynamically from your plugin code.

---

## 3. Accessing GUI Managers

All three primary managers are accessed through the `Player` component:

```java
// Get the Player component from an entity reference
Player playerComponent = store.getComponent(ref, Player.getComponentType());

// Access the managers
WindowManager windowManager = playerComponent.getWindowManager();
PageManager pageManager = playerComponent.getPageManager();
HudManager hudManager = playerComponent.getHudManager();

// Additional UI-related managers
HotbarManager hotbarManager = playerComponent.getHotbarManager();
WorldMapTracker worldMapTracker = playerComponent.getWorldMapTracker();

// Reset managers (HUD, windows, camera, movement, world map tracker)
playerComponent.resetManagers(holder);
```

---

## 4. When to Use Each System

| System      | Use Case                  | Examples                              |
|-------------|---------------------------|---------------------------------------|
| **Windows** | Item-based interactions   | Chests, crafting tables, furnaces     |
| **Pages**   | Full-screen UIs           | Shops, dialogs, settings menus        |
| **HUD**     | Always-visible info       | Health bars, compass, quest tracker   |

---

## 5. Quick Start Examples

### Opening a Custom Page

```java
public class MyCustomPage extends BasicCustomUIPage {
    public MyCustomPage(PlayerRef playerRef) {
        super(playerRef, CustomPageLifetime.CanDismiss);
    }

    @Override
    public void build(UICommandBuilder commands) {
        commands.append("Pages/MyPage.ui");
        commands.set("#title", "Welcome!");
    }
}

// Open the page
pageManager.openCustomPage(ref, store, new MyCustomPage(playerRef));
```

### Showing a Custom HUD

```java
public class BossHealthHud extends CustomUIHud {
    public BossHealthHud(PlayerRef playerRef) {
        super(playerRef);
    }

    @Override
    protected void build(UICommandBuilder builder) {
        builder.append("#hud-root", "ui/boss_health.ui");
        builder.set("#boss-name", "Dragon");
        builder.set("#health-bar", 1.0f);
    }
}

// Show the HUD
hudManager.setCustomHud(playerRef, new BossHealthHud(playerRef));
```

### Modifying HUD Components

```java
// Show only essential components
hudManager.setVisibleHudComponents(playerRef,
    HudComponent.Hotbar,
    HudComponent.Health,
    HudComponent.Reticle
);

// Hide specific components
hudManager.hideHudComponents(playerRef,
    HudComponent.Compass,
    HudComponent.ObjectivePanel
);
```

---

## 6. UI File System

Hytale uses `.ui` files as the client-side layout format. These text-based assets define UI structure, styles, and components:

```
Server UI Assets (built-in)
├── Common.ui                   # Global styles and variables
├── Common/
│   └── TextButton.ui          # Reusable components
└── Pages/
    ├── DialogPage.ui          # NPC dialogs
    ├── ShopPage.ui            # Shop interfaces
    └── RespawnPage.ui         # Death/respawn screen

Plugin Asset Pack Structure (your plugin)
src/main/resources/
├── manifest.json              # Set "IncludesAssetPack": true
└── Common/
    └── UI/
        └── Custom/
            ├── MyPage.ui          # Custom .ui files
            └── MyBackground.png   # Textures
```

### Creating Custom .ui Files

To create custom UI layouts with images in your plugin:

1. Set `"IncludesAssetPack": true` in `manifest.json`
2. Place `.ui` files in `src/main/resources/Common/UI/Custom/`
3. Reference them in Java as `Custom/MyPage.ui`
4. Use `PatchStyle(TexturePath: "image.png")` for loading textures (paths are relative to the .ui file)

---

## 7. Package References

| Class                        | Package                                                                          |
|------------------------------|----------------------------------------------------------------------------------|
| `WindowManager`              | `com.hypixel.hytale.server.core.entity.entities.player.windows`                  |
| `PageManager`                | `com.hypixel.hytale.server.core.entity.entities.player.pages`                    |
| `HudManager`                 | `com.hypixel.hytale.server.core.entity.entities.player.hud`                      |
| `HotbarManager`              | `com.hypixel.hytale.server.core.entity.entities.player`                          |
| `WorldMapTracker`            | `com.hypixel.hytale.server.core.universe.world`                                  |
| `UICommandBuilder`           | `com.hypixel.hytale.server.core.ui.builder`                                      |
| `UIEventBuilder`             | `com.hypixel.hytale.server.core.ui.builder`                                      |
| `EventData`                  | `com.hypixel.hytale.server.core.ui.builder`                                      |
| `Player`                     | `com.hypixel.hytale.server.core.entity.entities`                                 |
| `BasicCustomUIPage`          | `com.hypixel.hytale.server.core.entity.entities.player.pages`                    |
| `CustomUIPage`               | `com.hypixel.hytale.server.core.entity.entities.player.pages`                    |
| `InteractiveCustomUIPage`    | `com.hypixel.hytale.server.core.entity.entities.player.pages`                    |
| `CustomUIHud`                | `com.hypixel.hytale.server.core.entity.entities.player.hud`                      |
| `HudComponent`               | `com.hypixel.hytale.protocol.packets.interface_`                                 |
| `CustomPageLifetime`         | `com.hypixel.hytale.protocol.packets.interface_`                                 |

---

## 8. Windows System

The Hytale window system provides a server-authoritative GUI framework for displaying inventory interfaces, crafting tables, containers, and custom interfaces to players.

### 8.1 Architecture

```
WindowManager (Per-player window management)
├── Window (Base abstract class)
│   ├── ContainerWindow (Simple item container)
│   ├── ContainerBlockWindow (Block-bound container via BlockWindow)
│   ├── ItemStackContainerWindow (ItemStack-based container)
│   └── Custom window implementations
├── WindowType (Protocol-defined window types)
└── WindowAction (Client-to-server actions)

Window Hierarchy:
├── Window (abstract base)
│   └── BlockWindow (abstract, for block-bound windows)
│       └── ContainerBlockWindow

Window Interfaces:
├── ItemContainerWindow       - Windows with item storage (getItemContainer())
├── MaterialContainerWindow   - Windows with material/extra resources
│                               (getExtraResourcesSection(), invalidateExtraResources(), isValid())
└── ValidatedWindow           - Windows requiring periodic validation (validate())
```

### 8.2 WindowManager

The `WindowManager` handles all window operations for a specific player. It is accessed through the `Player` component's `getWindowManager()` method.

#### Accessing WindowManager

```java
import com.hypixel.hytale.server.core.entity.entities.player.windows.WindowManager;
import com.hypixel.hytale.server.core.entity.entities.Player;

// Get WindowManager from Player
Player player = store.getComponent(ref, Player.getComponentType());
WindowManager windowManager = player.getWindowManager();

// WindowManager is initialized internally via init(PlayerRef playerRef)
// This is called automatically when the player is set up
```

#### Opening Windows

```java
import com.hypixel.hytale.protocol.packets.window.OpenWindow;

// Open a window and get the packet to send
Window myWindow = new ContainerWindow(itemContainer);
OpenWindow packet = windowManager.openWindow(myWindow);

if (packet != null) {
    // Window opened successfully - packet returned for sending
    // The packet includes: id, windowType, windowData (JSON), inventory section, extra resources
    int windowId = myWindow.getId();
}

// Open multiple windows at once
Window[] windows = { window1, window2, window3 };
List<OpenWindow> packets = windowManager.openWindows(windows);

if (packets == null) {
    // One or more windows failed to open - all are closed
}
```

#### Updating Windows

```java
// Manually update a window (sends UpdateWindow packet via playerRef.getPacketHandler().writeNoCache())
// Includes inventory section for ItemContainerWindow, and extraResources for MaterialContainerWindow when !isValid()
windowManager.updateWindow(window);

// Mark a window as changed (will be updated on next tick)
windowManager.markWindowChanged(windowId);

// Update all dirty windows (called automatically by server)
// Iterates through all windows and sends UpdateWindow packet for dirty ones
windowManager.updateWindows();

// Validate all windows implementing ValidatedWindow interface
// Closes windows that fail validation (e.g., player moved too far from block)
// Called automatically by the server each tick
windowManager.validateWindows();
```

#### Closing Windows

```java
// Close a specific window by ID
// Sends CloseWindow packet, removes window, calls onClose()
// Throws IllegalArgumentException if id is -1
// Throws IllegalStateException if window doesn't exist
Window closedWindow = windowManager.closeWindow(windowId);

// Close all windows for the player
// Iterates through all windows and calls close() on each
windowManager.closeAllWindows();

// Close window from within the window instance
window.close();
```

#### Window ID Management

| ID   | Description                          |
|------|--------------------------------------|
| -1   | Invalid/unassigned                   |
| 0    | Reserved for client-initiated windows |
| 1+   | Server-assigned IDs (auto-incremented) |

```java
// Get a window by ID (throws IllegalArgumentException if id is -1)
Window window = windowManager.getWindow(windowId);

// Get all active windows (returns a new ObjectArrayList copy)
List<Window> allWindows = windowManager.getWindows();

// Static utility: Close and remove all windows from a UUID-keyed map
WindowManager.closeAndRemoveAll(Map<UUID, ? extends Window> windows);
```

### 8.3 Window Types

Windows are categorized by `WindowType`, an enum defining the client-side rendering:

| WindowType            | Value | Description                                  |
|-----------------------|-------|----------------------------------------------|
| `Container`           | 0     | Generic item container (chests, storage)     |
| `PocketCrafting`      | 1     | Quick crafting from inventory                |
| `BasicCrafting`       | 2     | Standard crafting bench interface            |
| `DiagramCrafting`     | 3     | Pattern-based crafting (diagrams)            |
| `StructuralCrafting`  | 4     | Building/structural crafting                 |
| `Processing`          | 5     | Processing stations (furnaces, etc.)         |
| `Memories`            | 6     | Memory/collection interface                  |

### 8.4 Creating Custom Windows

#### Basic Window Implementation

```java
import com.hypixel.hytale.server.core.entity.entities.player.windows.Window;
import com.hypixel.hytale.protocol.packets.window.WindowType;
import com.hypixel.hytale.protocol.packets.window.WindowAction;
import com.hypixel.hytale.component.Ref;
import com.hypixel.hytale.component.Store;
import com.hypixel.hytale.server.core.universe.world.storage.EntityStore;
import com.google.gson.JsonObject;
import javax.annotation.Nonnull;

public class CustomWindow extends Window {
    @Nonnull
    private final JsonObject windowData = new JsonObject();

    public CustomWindow() {
        super(WindowType.Container);
        windowData.addProperty("customProperty", "value");
    }

    @Override
    @Nonnull
    public JsonObject getData() {
        return windowData;
    }

    @Override
    protected boolean onOpen0() {
        // Called when window opens
        // Return false to cancel opening
        return true;
    }

    @Override
    protected void onClose0() {
        // Called when window closes
        // Clean up resources here
    }

    // Optional: Override to handle client actions
    @Override
    public void handleAction(@Nonnull Ref<EntityStore> ref,
                             @Nonnull Store<EntityStore> store,
                             @Nonnull WindowAction action) {
        // Handle window-specific actions
    }
}
```

#### Key Window Methods

```java
// Get the window type
WindowType type = window.getType();

// Get the window ID (assigned by WindowManager)
int id = window.getId();

// Get the player reference (available after init)
PlayerRef playerRef = window.getPlayerRef();

// Close this window
window.close();

// Mark the window as needing an update (calls invalidate internally)
// Use protected invalidate() method inside Window subclasses
protected void invalidate() {
    this.isDirty.set(true);
}

// Mark window as needing a full rebuild
protected void setNeedRebuild() {
    this.needRebuild.set(true);
    this.getData().addProperty("needRebuild", Boolean.TRUE);
}
```

#### Window Lifecycle

```
1.  Window constructed with WindowType
2.  WindowManager.openWindow(window) called
3.  Window ID auto-incremented and assigned via window.setId(id)
    - IDs wrap from MAX_INT back to 1 (never 0 or -1)
4.  Window.init(PlayerRef, WindowManager) called
5.  If window is ItemContainerWindow, change event registered automatically (EventPriority.LAST)
6.  Window.onOpen() -> onOpen0()
    - Return true to complete opening
    - Return false to cancel (window is closed, ID set to -1)
7.  window.consumeIsDirty() called
8.  OpenWindow packet created and returned (includes inventory section and extra resources if applicable)
9.  Window active - handles actions via handleAction(), updates via invalidate()
10. WindowManager.validateWindows() called each tick
    - Windows implementing ValidatedWindow are validated
    - Invalid windows are closed automatically
11. WindowManager.updateWindows() called each tick
    - Dirty windows send UpdateWindow packets automatically
12. Window.close() or WindowManager.closeWindow(id) called
13. CloseWindow packet sent to client via playerRef.getPacketHandler().writeNoCache()
14. Window removed from WindowManager's Int2ObjectConcurrentHashMap
15. If ItemContainerWindow, change event unregistered
16. Window.onClose() -> onClose0() called
17. WindowCloseEvent dispatched via closeEventRegistry
```

#### Window Data

Window data is sent to the client as JSON via the `getData()` method. The returned `JsonObject` is serialized and included in the `OpenWindow` and `UpdateWindow` packets:

```java
@Override
@Nonnull
public JsonObject getData() {
    JsonObject data = new JsonObject();
    data.addProperty("title", "My Window");
    data.addProperty("capacity", 27);
    data.addProperty("customFlag", true);
    return data;
}
```

> The window data string is serialized via `window.getData().toString()` and has a maximum size of **4,096,000 bytes** (UTF-8 length).

### 8.5 WindowAction Types

Client interactions are sent as `WindowAction` subtypes:

| Action                  | Description                                                          |
|-------------------------|----------------------------------------------------------------------|
| `CraftRecipeAction`     | Craft using a specific recipe                                        |
| `CraftItemAction`       | Craft a specific item                                                |
| `TierUpgradeAction`     | Upgrade crafting tier                                                |
| `SelectSlotAction`      | Select a slot in the window                                          |
| `ChangeBlockAction`     | Change block in structural crafting                                  |
| `SetActiveAction`       | Set active state                                                     |
| `UpdateCategoryAction`  | Change category filter                                               |
| `CancelCraftingAction`  | Cancel ongoing craft                                                 |
| `SortItemsAction`       | Sort items in container (sortType: Name=0, Type=1, Rarity=2)         |

#### Handling Actions

```java
@Override
public void handleAction(@Nonnull Ref<EntityStore> ref,
                         @Nonnull Store<EntityStore> store,
                         @Nonnull WindowAction action) {
    if (action instanceof SelectSlotAction selectSlot) {
        int slot = selectSlot.slot; // Direct field access, not getter
        // Handle slot selection
    } else if (action instanceof SortItemsAction sortAction) {
        // sortAction.sortType is a com.hypixel.hytale.protocol.SortType enum (Name=0, Type=1, Rarity=2)
        // Convert to server SortType using SortType.fromPacket(sortAction.sortType)
        com.hypixel.hytale.server.core.inventory.container.SortType sortType =
            com.hypixel.hytale.server.core.inventory.container.SortType.fromPacket(sortAction.sortType);
        // Sort the container contents
    }
}
```

### 8.6 Window Events

#### Close Event

The `WindowCloseEvent` is dispatched when a window closes. It implements `IEvent<Void>`.

```java
import com.hypixel.hytale.event.EventRegistration;
import com.hypixel.hytale.event.EventPriority;

// Register for window close events (default priority)
EventRegistration registration = window.registerCloseEvent(event -> {
    // Handle window close
    // Note: WindowCloseEvent is a simple event with no additional data
});

// Register with short priority value
EventRegistration registration = window.registerCloseEvent((short) 0, event -> {
    // Handle window close
});

// Register with EventPriority enum
EventRegistration registration = window.registerCloseEvent(EventPriority.LAST, event -> {
    // Handle window close
});

// Unregister when done
registration.unregister();
```

### 8.7 Built-in Window Classes

#### ContainerWindow

Basic item container window implementing `ItemContainerWindow`. Uses `WindowType.Container` and has minimal implementation (empty `onOpen0()` returns true, empty `onClose0()`):

```java
import com.hypixel.hytale.server.core.entity.entities.player.windows.ContainerWindow;
import com.hypixel.hytale.server.core.inventory.container.SimpleItemContainer;
import com.hypixel.hytale.protocol.packets.window.OpenWindow;

SimpleItemContainer container = new SimpleItemContainer((short) 27);
ContainerWindow window = new ContainerWindow(container);

// openWindow returns the OpenWindow packet (or null if opening failed)
OpenWindow packet = windowManager.openWindow(window);
if (packet != null) {
    // Window opened successfully, send the packet to the client
    playerRef.getPacketHandler().write(packet);
}
```

#### BlockWindow

Abstract base class for windows bound to a block position. Implements `ValidatedWindow` to automatically close when the player moves too far from the block or the block changes.

```java
// BlockWindow constructor (abstract class, used by subclasses)
// BlockWindow(WindowType windowType, int x, int y, int z, int rotationIndex, BlockType blockType)

// Static constant (used as default):
// private static final float MAX_DISTANCE = 7.0f;

// Key methods:
blockWindow.getX();                              // Block X coordinate
blockWindow.getY();                              // Block Y coordinate
blockWindow.getZ();                              // Block Z coordinate
blockWindow.getRotationIndex();
blockWindow.getBlockType();
blockWindow.setMaxDistance(double maxDistance);    // Default: 7.0 blocks
blockWindow.getMaxDistance();

// validate() checks:
// 1. PlayerRef is not null
// 2. Player reference and store are valid
// 3. Player distance to block <= maxDistanceSqr
// 4. Chunk containing block is loaded
// 5. Block at position has same Item as original blockType
blockWindow.validate();       // Returns false if any check fails
```

#### ContainerBlockWindow

Window bound to a block in the world. Extends `BlockWindow` and implements `ItemContainerWindow`. Includes built-in handling for `SortItemsAction`:

```java
import com.hypixel.hytale.server.core.entity.entities.player.windows.ContainerBlockWindow;
import com.hypixel.hytale.server.core.asset.type.blocktype.config.BlockType;

// Constructor takes block coordinates, rotation, block type, and item container
ContainerBlockWindow window = new ContainerBlockWindow(
    x,              // int - block X position
    y,              // int - block Y position
    z,              // int - block Z position
    rotationIndex,  // int - block rotation
    blockType,      // BlockType - the block type
    itemContainer   // ItemContainer - the container for items
);

// Window data automatically includes blockItemId from blockType.getItem().getId()
// handleAction() automatically handles SortItemsAction:
//   - Converts protocol SortType to server SortType via SortType.fromPacket()
//   - Saves the sort type to player's inventory via playerComponent.getInventory().setSortType()
//   - Sorts the container items via itemContainer.sortItems()
//   - Invalidates the window to trigger an update
```

#### ItemStackContainerWindow

Window for containers that are stored within an ItemStack. Implements `ItemContainerWindow`:

```java
import com.hypixel.hytale.server.core.entity.entities.player.windows.ItemStackContainerWindow;
import com.hypixel.hytale.server.core.inventory.container.ItemStackItemContainer;

// ItemStackItemContainer wraps an ItemStack's container
ItemStackContainerWindow window = new ItemStackContainerWindow(itemStackItemContainer);

// On open, registers a change event on the parent container
// Automatically closes if the parent ItemStack becomes invalid (checked via isItemStackValid())
// On close, unregisters the change event
```

### 8.8 Client-Requestable Windows

Some windows can be opened by client request. These must be registered in the static `Window.CLIENT_REQUESTABLE_WINDOW_TYPES` map:

```java
import com.hypixel.hytale.server.core.entity.entities.player.windows.Window;
import com.hypixel.hytale.protocol.packets.window.WindowType;
import java.util.function.Supplier;

// CLIENT_REQUESTABLE_WINDOW_TYPES is a ConcurrentHashMap<WindowType, Supplier<? extends Window>>
// Register a window type that clients can request to open
Window.CLIENT_REQUESTABLE_WINDOW_TYPES.put(WindowType.Container, MyContainerWindow::new);

// Client-opened windows use ID 0 and are handled via clientOpenWindow()
// Returns UpdateWindow packet instead of OpenWindow packet
// Throws IllegalArgumentException if window type is not registered
```

> Client-requested windows always use window ID 0 and replace any existing window at that ID. If a window already exists at ID 0, it is closed before the new window opens.

### 8.9 Best Practices

1. **Validate window state** – Check if window is still valid before operations.
2. **Handle close gracefully** – Clean up resources in `onClose0()`.
3. **Use `invalidate()` for updates** – Call `invalidate()` to mark window dirty, then `WindowManager.updateWindows()` sends updates.
4. **Use appropriate types** – Choose the right `WindowType` for rendering.
5. **Limit open windows** – Close old windows before opening new ones.
6. **Register ItemContainer change events** – WindowManager automatically registers change events for `ItemContainerWindow` implementations.
7. **Implement `ValidatedWindow`** – For windows that should close based on conditions (e.g., distance from block).

---

## 9. Custom Pages System

The Custom Pages System allows you to create fully customizable GUI interfaces for players. This includes interactive dialogs, settings pages, choice menus, shop interfaces, and more.

### 9.1 Architecture

```
PageManager (Per-Player)
├── Standard Pages (Page enum)
│   └── None, Bench, Inventory, ToolsSettings, Map, etc.
└── Custom Pages (CustomUIPage hierarchy)
    ├── BasicCustomUIPage              - Simple display-only pages
    ├── InteractiveCustomUIPage<T>     - Pages with event handling
    └── ChoiceBasePage                 - Choice/dialog pages
```

### 9.2 PageManager

The `PageManager` handles opening, closing, and updating pages for each player. Access it through the `Player` component.

#### Key Methods

| Method                                                          | Description                                      |
|-----------------------------------------------------------------|--------------------------------------------------|
| `setPage(ref, store, page)`                                     | Set a standard page (from Page enum)             |
| `setPage(ref, store, page, canCloseThroughInteraction)`        | Set page with close-through-interaction option   |
| `setPageWithWindows(ref, store, page, canClose, windows...)`   | Set page with inventory windows                  |
| `openCustomPage(ref, store, customPage)`                        | Open a custom UI page                            |
| `openCustomPageWithWindows(ref, store, page, windows...)`       | Open custom page with inventory windows          |
| `getCustomPage()`                                               | Get the currently open custom page               |
| `init(playerRef, windowManager)`                                | Initialize the PageManager (called automatically)|

#### Standard Page Enum

| Value               | Description                           |
|---------------------|---------------------------------------|
| `None`              | No page open (closes current page)    |
| `Bench`             | Crafting bench interface              |
| `Inventory`         | Player inventory                      |
| `ToolsSettings`     | Tool settings interface               |
| `Map`               | World map                             |
| `MachinimaEditor`   | Machinima editing tools               |
| `ContentCreation`   | Content creation tools                |
| `Custom`            | Custom page (used internally)         |

#### Opening Pages

```java
Player playerComponent = store.getComponent(ref, Player.getComponentType());
PageManager pageManager = playerComponent.getPageManager();

// Open standard page
pageManager.setPage(ref, store, Page.Inventory);

// Open page that can be closed by clicking elsewhere
pageManager.setPage(ref, store, Page.Bench, true);

// Close any open page
pageManager.setPage(ref, store, Page.None);
```

### 9.3 CustomUIPage Hierarchy

#### CustomUIPage (Base Class)

```java
public abstract class CustomUIPage {
    protected final PlayerRef playerRef;
    protected CustomPageLifetime lifetime;

    // Must implement - builds the initial page UI
    public abstract void build(
        Ref<EntityStore> ref,
        UICommandBuilder commandBuilder,
        UIEventBuilder eventBuilder,
        Store<EntityStore> store
    );

    // Override for cleanup when page is dismissed
    public void onDismiss(Ref<EntityStore> ref, Store<EntityStore> store);

    // Rebuild the entire page UI
    protected void rebuild();

    // Send partial updates to the page (multiple overloads)
    protected void sendUpdate();                                                          // No commands (does not rebuild)
    protected void sendUpdate(@Nullable UICommandBuilder commandBuilder);
    protected void sendUpdate(@Nullable UICommandBuilder commandBuilder, boolean clear);

    // Get/set the page lifetime
    public CustomPageLifetime getLifetime();
    public void setLifetime(CustomPageLifetime lifetime);

    // Close this page
    protected void close();
}
```

#### CustomPageLifetime Enum

| Value                                    | Description                                          |
|------------------------------------------|------------------------------------------------------|
| `CantClose`                              | Player cannot close the page (e.g., death screen)    |
| `CanDismiss`                             | Player can dismiss with escape key                   |
| `CanDismissOrCloseThroughInteraction`    | Can dismiss or close by clicking outside             |

#### BasicCustomUIPage

For simple pages that don't need event handling:

```java
public class WelcomePage extends BasicCustomUIPage {
    public WelcomePage(PlayerRef playerRef) {
        super(playerRef, CustomPageLifetime.CanDismiss);
    }

    @Override
    public void build(UICommandBuilder commandBuilder) {
        commandBuilder.append("Pages/WelcomePage.ui");
        commandBuilder.set("#Title.Text", "Welcome!");
        commandBuilder.set("#PlayerName.Text", playerRef.getUsername());
    }
}
```

#### InteractiveCustomUIPage

For pages that handle user interactions. This class extends `CustomUIPage` with typed event handling and has an additional `sendUpdate` signature:

```java
// Additional sendUpdate signature for interactive pages
protected void sendUpdate(@Nullable UICommandBuilder commandBuilder,
                          @Nullable UIEventBuilder eventBuilder,
                          boolean clear);
```

```java
public class SettingsPage extends InteractiveCustomUIPage<SettingsEventData> {
    public SettingsPage(PlayerRef playerRef) {
        super(playerRef, CustomPageLifetime.CanDismiss, SettingsEventData.CODEC);
    }

    @Override
    public void build(Ref<EntityStore> ref, UICommandBuilder commands,
                      UIEventBuilder events, Store<EntityStore> store) {
        commands.append("Pages/SettingsPage.ui");

        // Bind save button (note: keys that start with letters must be uppercase)
        events.addEventBinding(
            CustomUIEventBindingType.Activating,
            "#SaveButton",
            EventData.of("Action", "save")
        );
    }

    @Override
    public void handleDataEvent(Ref<EntityStore> ref, Store<EntityStore> store,
                                SettingsEventData data) {
        if ("save".equals(data.action)) {
            // Handle save
            close();
        }
    }
}
```

### 9.4 Event Data Class

Create a data class with codec for receiving events:

```java
public static class SettingsEventData {
    public static final BuilderCodec<SettingsEventData> CODEC =
        BuilderCodec.builder(SettingsEventData.class, SettingsEventData::new)
            .append(new KeyedCodec<>("Action", Codec.STRING),
                    (d, v) -> d.action = v, d -> d.action)
            .add()
            .append(new KeyedCodec<>("@Value", Codec.INTEGER),
                    (d, v) -> d.value = v, d -> d.value)
            .add()
            .build();

    public String action;
    public Integer value;
}
```

#### Event Data Keys

> **Important:** `KeyedCodec` requires that if a key starts with a letter, it must be uppercase. `@`-prefixed reference keys are allowed.

- **Static keys** (e.g., `"Action"`) – Sent as literal values; if they start with a letter, it must be uppercase.
- **Reference keys** (prefixed with `@`, e.g., `"@Value"`) – Reference UI element values at event time.

#### EventData Methods

`EventData` only supports `String` and `Enum` values. Numbers must be converted to strings:

```java
// Static factory method - keys that start with letters must be uppercase
EventData.of("Action", "save")
    // Append methods (returns self for chaining)
    .append("ItemId", "sword_01")
    .append("State", MyEnum.VALUE)
    // For integers, convert to string
EventData.of("Action", "buy").append("Index", Integer.toString(i))
```

### 9.5 UIEventBuilder

The `UIEventBuilder` creates event bindings for UI elements:

```java
// Basic event binding
events.addEventBinding(CustomUIEventBindingType.Activating, "#Button");

// With event data (keys that start with letters must be uppercase)
events.addEventBinding(CustomUIEventBindingType.Activating, "#Button",
    EventData.of("Action", "click"));

// With locksInterface parameter (default is true)
events.addEventBinding(CustomUIEventBindingType.Activating, "#Button",
    EventData.of("Action", "click"), false);
```

#### CustomUIEventBindingType

| Type                           | Description                                    |
|--------------------------------|------------------------------------------------|
| `Activating`                   | Element clicked/activated                      |
| `RightClicking`                | Right mouse button click                       |
| `DoubleClicking`               | Double click                                   |
| `MouseEntered`                 | Mouse enters element                           |
| `MouseExited`                  | Mouse exits element                            |
| `ValueChanged`                 | Input value changed                            |
| `ElementReordered`             | Element reordered in list                      |
| `Validating`                   | Input validation                               |
| `Dismissing`                   | Page being dismissed                           |
| `FocusGained`                  | Element gained focus                           |
| `FocusLost`                    | Element lost focus                             |
| `KeyDown`                      | Key pressed                                    |
| `MouseButtonReleased`          | Mouse button released                          |
| `SlotClicking`                 | Inventory slot clicked                         |
| `SlotDoubleClicking`           | Inventory slot double-clicked                  |
| `SlotMouseEntered`             | Mouse enters slot                              |
| `SlotMouseExited`              | Mouse exits slot                               |
| `DragCancelled`                | Drag operation cancelled                       |
| `Dropped`                      | Element dropped                                |
| `SlotMouseDragCompleted`       | Slot drag completed                            |
| `SlotMouseDragExited`          | Drag exited slot                               |
| `SlotClickReleaseWhileDragging`| Click released while dragging                  |
| `SlotClickPressWhileDragging`  | Click pressed while dragging                   |
| `SelectedTabChanged`           | Tab selection changed                          |

### 9.6 UICommandBuilder

The `UICommandBuilder` creates UI update commands:

#### Layout Commands

| Method                                  | Description                                  |
|-----------------------------------------|----------------------------------------------|
| `append(documentPath)`                  | Append UI document at root                   |
| `append(selector, documentPath)`        | Append UI document to element                |
| `appendInline(selector, document)`      | Append inline UI definition                  |
| `insertBefore(selector, documentPath)`  | Insert UI document before element            |
| `insertBeforeInline(selector, document)`| Insert inline UI before element              |
| `clear(selector)`                       | Clear element's children                     |
| `remove(selector)`                      | Remove element from DOM                      |

#### Value Setting Commands

| Method                              | Description                                       |
|-------------------------------------|---------------------------------------------------|
| `set(selector, String)`             | Set string value                                  |
| `set(selector, boolean)`            | Set boolean value                                 |
| `set(selector, int)`                | Set integer value                                 |
| `set(selector, float)`              | Set float value                                   |
| `set(selector, double)`             | Set double value                                  |
| `set(selector, Message)`            | Set localized message                             |
| `set(selector, Value<T>)`           | Set reference value                               |
| `set(selector, T[])`                | Set array of values                               |
| `set(selector, List<T>)`            | Set list of values                                |
| `setNull(selector)`                 | Set null value                                    |
| `setObject(selector, Object)`       | Set compatible object (Area, ItemGridSlot, etc.)  |

### 9.7 Complete Interactive Example

```java
public class ShopPage extends InteractiveCustomUIPage<ShopPage.ShopEventData> {
    private final List<ShopItem> items;
    private int playerCoins;

    public ShopPage(PlayerRef playerRef, List<ShopItem> items, int coins) {
        super(playerRef, CustomPageLifetime.CanDismiss, ShopEventData.CODEC);
        this.items = items;
        this.playerCoins = coins;
    }

    @Override
    public void build(Ref<EntityStore> ref, UICommandBuilder commands,
                      UIEventBuilder events, Store<EntityStore> store) {
        commands.append("Pages/ShopPage.ui");
        commands.set("#CoinsLabel.Text", playerCoins + " coins");

        for (int i = 0; i < items.size(); i++) {
            ShopItem item = items.get(i);
            commands.append("#ItemList", "Components/ShopItem.ui");
            commands.set("#Item" + i + ".Name", item.getName());
            commands.set("#Item" + i + ".Price", item.getPrice() + "c");

            // Note: KeyedCodec keys that start with letters must be uppercase
            events.addEventBinding(
                CustomUIEventBindingType.Activating,
                "#BuyBtn" + i,
                EventData.of("Action", "buy").append("Index", Integer.toString(i))
            );
        }

        events.addEventBinding(
            CustomUIEventBindingType.Activating,
            "#CloseBtn",
            EventData.of("Action", "close")
        );
    }

    @Override
    public void handleDataEvent(Ref<EntityStore> ref, Store<EntityStore> store,
                                ShopEventData data) {
        switch (data.action) {
            case "buy":
                ShopItem item = items.get(data.index);
                if (playerCoins >= item.getPrice()) {
                    playerCoins -= item.getPrice();
                    // Give item to player...

                    // Update UI
                    UICommandBuilder update = new UICommandBuilder();
                    update.set("#CoinsLabel.Text", playerCoins + " coins");
                    sendUpdate(update);
                }
                break;
            case "close":
                close();
                break;
        }
    }

    public static class ShopEventData {
        public static final BuilderCodec<ShopEventData> CODEC =
            BuilderCodec.builder(ShopEventData.class, ShopEventData::new)
                .append(new KeyedCodec<>("Action", Codec.STRING),
                        (d, v) -> d.action = v, d -> d.action).add()
                .append(new KeyedCodec<>("Index", Codec.INTEGER),
                        (d, v) -> d.index = v, d -> d.index).add()
                .build();

        public String action;
        public Integer index;
    }
}
```

### 9.8 Updating Pages Dynamically

#### Partial Updates

```java
private void updateScore(int newScore) {
    UICommandBuilder builder = new UICommandBuilder();
    builder.set("#ScoreLabel.Text", String.valueOf(newScore));
    sendUpdate(builder);
}
```

#### Full Rebuild

```java
// Completely rebuild the page
rebuild();
```

### 9.9 ChoiceBasePage

A specialized page for presenting choices/dialogs to players. Extends `InteractiveCustomUIPage<ChoicePageEventData>`:

```java
public abstract class ChoiceBasePage extends InteractiveCustomUIPage<ChoicePageEventData> {
    public ChoiceBasePage(PlayerRef playerRef, ChoiceElement[] elements, String pageLayout) {
        super(playerRef, CustomPageLifetime.CanDismiss, ChoicePageEventData.CODEC);
        // ...
    }

    protected ChoiceElement[] getElements();
    protected String getPageLayout();
}
```

The page automatically:
- Appends the page layout
- Clears `#ElementList`
- Adds buttons for each `ChoiceElement` with `Activating` event bindings
- Handles element selection and runs associated `ChoiceInteraction`s

### 9.10 Creating Custom .ui Files

For fully custom page layouts with images and custom styling, create `.ui` files in your plugin's asset pack.

#### Directory Structure

```
src/main/resources/
├── manifest.json                              # Set "IncludesAssetPack": true
└── Common/
    └── UI/
        └── Custom/
            ├── MyStatusPage.ui                # Your custom .ui file
            └── MyBackground.png               # Images
```

#### Example Custom Page (.ui file)

Create `src/main/resources/Common/UI/Custom/MyStatusPage.ui`:

```
// Include Common.ui to access built-in styles
$Common = "Common.ui";

// Define texture (path relative to this .ui file)
@MyTex = PatchStyle(TexturePath: "MyBackground.png");

Group {
    LayoutMode: Center;

    Group #MyPanel {
        Background: @MyTex;
        Anchor: (Width: 400, Height: 300);
        LayoutMode: Top;

        // Dynamic text (set from Java)
        Label #WelcomeText {
            Style: $Common.@DefaultLabelStyle;
            Anchor: (Bottom: 8);
        }

        Label #StatusText {
            Style: (FontSize: 12, TextColor: #cccccc, Wrap: true, HorizontalAlignment: Center);
        }
    }
}
```

#### Java Page Class

```java
public class MyStatusPage extends InteractiveCustomUIPage<MyStatusPage.EventData> {
    // Reference your .ui file from Custom/ directory
    private static final String PAGE_LAYOUT = "Custom/MyStatusPage.ui";

    public MyStatusPage(PlayerRef playerRef) {
        super(playerRef, CustomPageLifetime.CanDismiss, EventData.CODEC);
    }

    @Override
    public void build(Ref<EntityStore> ref, UICommandBuilder commands,
                      UIEventBuilder events, Store<EntityStore> store) {
        // Load the custom .ui page
        commands.append(PAGE_LAYOUT);

        // Set dynamic text content using element IDs from the .ui file
        commands.set("#WelcomeText.Text", "Welcome, " + playerRef.getUsername() + "!");
        commands.set("#StatusText.Text", "Your current status information here.");
    }

    @Override
    public void handleDataEvent(Ref<EntityStore> ref, Store<EntityStore> store, EventData data) {
        // Handle events or close page
    }

    public static class EventData {
        public static final BuilderCodec<EventData> CODEC = BuilderCodec
            .builder(EventData.class, EventData::new)
            .build();
    }
}
```

#### Key Points for Custom .ui Files

1. **Import Common.ui** – Use `$Common = "Common.ui";` to access built-in styles.
2. **Reference styles** – Use `Style: $Common.@DefaultInputFieldStyle;` for consistent styling.
3. **Texture paths are relative** – Put images in the same folder and reference by filename.
4. **PatchStyle for images** – Define with `@MyTex = PatchStyle(TexturePath: "file.png");` and apply with `Background: @MyTex;`.
5. **Textures auto-stretch** – Images automatically stretch to fit the element size.

### 9.11 Built-in UI Files

The game includes built-in UI files for common pages:

| File                      | Purpose                       |
|---------------------------|-------------------------------|
| `Pages/DialogPage.ui`     | NPC conversation dialogs      |
| `Pages/ShopPage.ui`       | Shop interfaces               |
| `Pages/BarterPage.ui`     | Trading interfaces            |
| `Pages/RespawnPage.ui`    | Death/respawn screen          |
| `Pages/WarpListPage.ui`   | Teleportation lists           |
| `Pages/CommandListPage.ui`| Command browser               |
| `Pages/PluginListPage.ui` | Plugin management             |

### 9.12 Best Practices

1. **Use appropriate lifetime** – `CantClose` for important dialogs, `CanDismiss` for menus.
2. **Handle all events** – Always have a way to close the page.
3. **Validate event data** – Clients can send unexpected values.
4. **Batch updates** – Combine multiple changes in one `sendUpdate()` call.
5. **Clean up in `onDismiss`** – Release resources when page closes.

---

## 10. HUD System

The Hytale HUD system provides comprehensive control over the player's heads-up display, including built-in components, custom overlays, notifications, and event titles.

### 10.1 Architecture

```
HudManager (per-player)
├── visibleHudComponents               - Set of currently visible built-in components
├── unmodifiableVisibleHudComponents   - Read-only view of visible components
├── customHud                          - Optional custom HUD overlay (nullable)
└── Methods for visibility control

CustomUIHud (abstract)
├── playerRef                - Reference to the player
├── build()                  - Define HUD structure using UICommandBuilder
├── show()                   - Display the HUD to the player
└── update()                 - Send incremental updates
```

### 10.2 HudManager

The `HudManager` class controls HUD visibility and custom overlays for individual players.

#### Getting the HudManager

```java
import com.hypixel.hytale.server.core.entity.entities.Player;
import com.hypixel.hytale.server.core.entity.entities.player.hud.HudManager;

Player playerComponent = store.getComponent(entityRef, Player.getComponentType());
HudManager hudManager = playerComponent.getHudManager();
```

#### Setting Visible Components

```java
import com.hypixel.hytale.protocol.packets.interface_.HudComponent;

// Show only specific components (replaces all)
hudManager.setVisibleHudComponents(playerRef,
    HudComponent.Hotbar,
    HudComponent.Health,
    HudComponent.Chat,
    HudComponent.Reticle
);

// Using a Set
Set<HudComponent> components = Set.of(
    HudComponent.Hotbar,
    HudComponent.Health,
    HudComponent.Stamina
);
hudManager.setVisibleHudComponents(playerRef, components);
```

#### Showing and Hiding Components

```java
// Show additional components
hudManager.showHudComponents(playerRef,
    HudComponent.Compass,
    HudComponent.ObjectivePanel
);

// Hide specific components (varargs only, no Set overload)
hudManager.hideHudComponents(playerRef,
    HudComponent.KillFeed,
    HudComponent.Notifications
);
```

#### Resetting HUD

```java
// Reset to default components and clear custom HUD
hudManager.resetHud(playerRef);

// Reset entire UI state (sends ResetUserInterfaceState packet)
hudManager.resetUserInterface(playerRef);
```

#### Querying HUD State

```java
// Get the current custom HUD (may be null)
CustomUIHud customHud = hudManager.getCustomHud();

// Get the current set of visible components (returns unmodifiable Set)
Set<HudComponent> visible = hudManager.getVisibleHudComponents();
```

### 10.3 HudComponent Enum

All built-in HUD components:

| Component                            | Value | Description                               |
|--------------------------------------|-------|-------------------------------------------|
| `Hotbar`                             | 0     | Player hotbar/inventory bar               |
| `StatusIcons`                        | 1     | Status effect icons                       |
| `Reticle`                            | 2     | Crosshair/targeting reticle               |
| `Chat`                               | 3     | Chat window                               |
| `Requests`                           | 4     | Friend/party requests                     |
| `Notifications`                      | 5     | Toast notifications                       |
| `KillFeed`                           | 6     | Kill/death messages                       |
| `InputBindings`                      | 7     | Key binding hints                         |
| `PlayerList`                         | 8     | Tab player list                           |
| `EventTitle`                         | 9     | Event title display area                  |
| `Compass`                            | 10    | Navigation compass                        |
| `ObjectivePanel`                     | 11    | Quest/objective tracker                   |
| `PortalPanel`                        | 12    | Portal-related UI                         |
| `BuilderToolsLegend`                 | 13    | Builder tools legend                      |
| `Speedometer`                        | 14    | Speed indicator                           |
| `UtilitySlotSelector`                | 15    | Utility slot selection                    |
| `BlockVariantSelector`               | 16    | Block variant picker                      |
| `BuilderToolsMaterialSlotSelector`   | 17    | Builder material slot                     |
| `Stamina`                            | 18    | Stamina bar                               |
| `AmmoIndicator`                      | 19    | Ammunition counter                        |
| `Health`                             | 20    | Health bar                                |
| `Mana`                               | 21    | Mana bar                                  |
| `Oxygen`                             | 22    | Oxygen/breath bar                         |
| `Sleep`                              | 23    | Sleep indicator                           |

#### Default Components

The following components are visible by default (stored in `DEFAULT_HUD_COMPONENTS`):

```java
Set.of(
    HudComponent.UtilitySlotSelector, HudComponent.BlockVariantSelector,
    HudComponent.StatusIcons, HudComponent.Hotbar, HudComponent.Chat,
    HudComponent.Notifications, HudComponent.KillFeed, HudComponent.InputBindings,
    HudComponent.Reticle, HudComponent.Compass, HudComponent.Speedometer,
    HudComponent.ObjectivePanel, HudComponent.PortalPanel, HudComponent.EventTitle,
    HudComponent.Stamina, HudComponent.AmmoIndicator, HudComponent.Health,
    HudComponent.Mana, HudComponent.Oxygen, HudComponent.BuilderToolsLegend,
    HudComponent.Sleep
)
```

> **Note:** Notably absent from defaults: `Requests`, `PlayerList`, `BuilderToolsMaterialSlotSelector`

### 10.4 CustomUIHud

Create custom HUD overlays that display alongside built-in components. The `CustomUIHud` class is abstract and requires implementing the `build()` method.

#### Creating a Custom HUD

```java
import com.hypixel.hytale.server.core.entity.entities.player.hud.CustomUIHud;
import com.hypixel.hytale.server.core.ui.builder.UICommandBuilder;

public class BossHealthHud extends CustomUIHud {
    private String bossName;
    private float healthPercent = 1.0f;

    public BossHealthHud(PlayerRef playerRef, String bossName) {
        super(playerRef);
        this.bossName = bossName;
    }

    @Override
    protected void build(UICommandBuilder builder) {
        builder.append("#hud-root", "ui/custom/boss_health.ui");
        builder.set("#boss-name", bossName);
        builder.set("#health-bar-fill", healthPercent);
    }

    public void updateHealth(float percent) {
        this.healthPercent = percent;
        UICommandBuilder builder = new UICommandBuilder();
        builder.set("#health-bar-fill", healthPercent);
        update(false, builder);  // false = don't clear existing HUD
    }
}
```

> **Note:** The `getPlayerRef()` method is inherited from `CustomUIHud` – you can call it directly via `getPlayerRef()`.

#### Displaying the HUD

```java
// Create and show custom HUD
BossHealthHud bossHud = new BossHealthHud(playerRef, "Dragon Lord");
hudManager.setCustomHud(playerRef, bossHud);

// Update the HUD later
bossHud.updateHealth(0.5f);

// Remove custom HUD
hudManager.setCustomHud(playerRef, null);
```

### 10.5 Event Titles

Display large announcement titles on screen.

#### EventTitleUtil Constants

| Constant              | Value    | Description                                     |
|-----------------------|----------|-------------------------------------------------|
| `DEFAULT_ZONE`        | "Void"   | Default zone name                               |
| `DEFAULT_DURATION`    | 4.0f     | Default display time in seconds                 |
| `DEFAULT_FADE_DURATION` | 1.5f   | Default fade duration (used for both in/out)    |

#### EventTitleUtil

```java
import com.hypixel.hytale.server.core.util.EventTitleUtil;
import com.hypixel.hytale.server.core.Message;

// Show title to player (full parameters)
EventTitleUtil.showEventTitleToPlayer(
    playerRef,
    Message.raw("Zone Discovered"),           // Primary title
    Message.raw("Welcome to the Dark Forest"),// Secondary title
    true,                                     // isMajor (large display)
    "ui/icons/forest.png",                    // Optional icon (nullable)
    4.0f,                                     // Duration (seconds)
    1.5f,                                     // Fade in duration
    1.5f                                      // Fade out duration
);

// Simplified version (uses default duration and fade)
EventTitleUtil.showEventTitleToPlayer(
    playerRef,
    Message.translation("zone.name"),
    Message.translation("zone.desc"),
    true  // isMajor
);

// Hide title early
EventTitleUtil.hideEventTitleFromPlayer(playerRef, 0.5f);

// Show to all players in world
EventTitleUtil.showEventTitleToWorld(
    Message.raw("Wave 5"),
    Message.raw("Prepare!"),
    true, "ui/icons/warning.png",
    4.0f, 1.5f, 1.5f,
    store  // Store<EntityStore>
);

// Show to all players in the universe (uses Universe.get() internally)
EventTitleUtil.showEventTitleToUniverse(
    Message.raw("Server Event"),
    Message.raw("Global announcement!"),
    true,
    "ui/icons/announcement.png",
    4.0f, 1.5f, 1.5f
);

// Hide title from all players in world
EventTitleUtil.hideEventTitleFromWorld(0.5f, store);
```

### 10.6 Notifications

Display toast notifications.

#### NotificationUtil

```java
import com.hypixel.hytale.server.core.util.NotificationUtil;
import com.hypixel.hytale.protocol.packets.interface_.NotificationStyle;

// Simple notification (string)
NotificationUtil.sendNotification(
    playerRef.getPacketHandler(),
    "Quest completed!"
);

// With style
NotificationUtil.sendNotification(
    playerRef.getPacketHandler(),
    Message.raw("Achievement Unlocked"),
    NotificationStyle.Success
);

// With icon and style
NotificationUtil.sendNotification(
    playerRef.getPacketHandler(),
    Message.raw("New Item"),
    "ui/icons/sword.png",
    NotificationStyle.Success
);

// Full parameters with secondary message, icon, item, and style
NotificationUtil.sendNotification(
    playerRef.getPacketHandler(),
    Message.raw("New Item"),           // Primary message
    Message.raw("Diamond Sword"),      // Secondary message (nullable)
    "ui/icons/sword.png",              // Icon path (nullable)
    itemWithAllMetadata,               // ItemWithAllMetadata (nullable)
    NotificationStyle.Success          // Style (required, non-null)
);

// Broadcast to all players in a world
NotificationUtil.sendNotificationToWorld(
    Message.raw("Server Notice"),
    null,                              // Secondary message
    null,                              // Icon
    null,                              // Item
    NotificationStyle.Warning,
    store                              // Store<EntityStore>
);

// Broadcast to all players in the universe (uses Universe.get() internally)
NotificationUtil.sendNotificationToUniverse(
    Message.raw("Global Announcement"),
    NotificationStyle.Success
);

// Alternative universe broadcast overloads
NotificationUtil.sendNotificationToUniverse("Simple string message");
NotificationUtil.sendNotificationToUniverse("Primary", "Secondary");
NotificationUtil.sendNotificationToUniverse(
    Message.raw("With icon"), "icon.png", NotificationStyle.Default);
```

#### NotificationStyle Enum

| Style      | Description                  |
|------------|------------------------------|
| `Default`  | Standard notification        |
| `Danger`   | Red/danger styling           |
| `Warning`  | Yellow/warning styling       |
| `Success`  | Green/success styling        |

### 10.7 Kill Feed

Display kill/death messages.

```java
import com.hypixel.hytale.protocol.packets.interface_.KillFeedMessage;
import com.hypixel.hytale.protocol.FormattedMessage;

// KillFeedMessage takes FormattedMessage objects directly
KillFeedMessage message = new KillFeedMessage(
    killerFormattedMessage,    // FormattedMessage (nullable) - killer info
    decedentFormattedMessage,  // FormattedMessage (nullable) - victim info
    "ui/icons/sword.png"       // String (nullable) - icon path
);
playerRef.getPacketHandler().writeNoCache(message);

// Using Message helper to create FormattedMessage
KillFeedMessage message = new KillFeedMessage(
    Message.raw("Player1").getFormattedMessage(),
    Message.raw("Player2").getFormattedMessage(),
    "ui/icons/sword.png"
);
```

### 10.8 Practical Examples

#### Minigame HUD

```java
public class MinigameHud extends CustomUIHud {
    private int score = 0;
    private int timeRemaining = 300;

    public MinigameHud(PlayerRef playerRef) {
        super(playerRef);
    }

    @Override
    protected void build(UICommandBuilder builder) {
        builder.append("ui/minigame/scoreboard.ui");
        builder.set("#score-value", score);
        builder.set("#time-value", formatTime(timeRemaining));
    }

    public void updateScore(int newScore) {
        this.score = newScore;
        UICommandBuilder builder = new UICommandBuilder();
        builder.set("#score-value", score);
        update(false, builder);
    }

    private String formatTime(int seconds) {
        return String.format("%d:%02d", seconds / 60, seconds % 60);
    }
}
```

#### Cinematic Mode

```java
public void enterCinematicMode(PlayerRef playerRef, HudManager hudManager) {
    hudManager.setVisibleHudComponents(playerRef, HudComponent.Chat);
}

public void exitCinematicMode(PlayerRef playerRef, HudManager hudManager) {
    hudManager.resetHud(playerRef);
}
```

#### Boss Fight Setup

```java
public void startBossFight(PlayerRef playerRef, HudManager hudManager, String bossName) {
    // Show boss health HUD
    BossHealthHud bossHud = new BossHealthHud(playerRef, bossName);
    hudManager.setCustomHud(playerRef, bossHud);

    // Show event title
    EventTitleUtil.showEventTitleToPlayer(playerRef,
        Message.raw("BOSS FIGHT"), Message.raw(bossName),
        true, "ui/icons/skull.png", 3.0f, 0.5f, 0.5f);

    // Show notification
    NotificationUtil.sendNotification(
        playerRef.getPacketHandler(),
        Message.raw("A powerful enemy approaches!"),
        NotificationStyle.Danger);
}
```

### 10.9 Best Practices

1. **Minimize updates** – Batch HUD updates to reduce network traffic.
2. **Use incremental updates** – Pass `clear=false` to `update()` for partial updates.
3. **Cache HUD instances** – Reuse `CustomUIHud` rather than recreating.
4. **Respect preferences** – Allow players to toggle optional elements.
5. **Clean up on disconnect** – Clear custom HUDs explicitly (e.g., `setCustomHud(playerRef, null)` or `resetHud(playerRef)`) when the player leaves.

---

## 11. UI Building Tools

The UI building tools provide a fluent API for constructing and updating user interfaces from server-side code.

### 11.1 UICommandBuilder

Build UI manipulation commands to send to the client.

#### Creating a Builder

```java
import com.hypixel.hytale.server.core.ui.builder.UICommandBuilder;

UICommandBuilder builder = new UICommandBuilder();
```

#### Command Types

These are the available `CustomUICommandType` enum values from `com.hypixel.hytale.protocol.packets.interface_`:

| Type                 | Description                                                  |
|----------------------|--------------------------------------------------------------|
| `Append`             | Add elements from a document path to root or a selector      |
| `AppendInline`       | Add elements from inline UI definition to a selector         |
| `InsertBefore`       | Insert elements from a document path before a selector       |
| `InsertBeforeInline` | Insert inline elements before a selector                     |
| `Remove`             | Remove elements matching selector                            |
| `Set`                | Set property value on elements                               |
| `Clear`              | Clear children of elements matching selector                 |

```java
import com.hypixel.hytale.protocol.packets.interface_.CustomUICommandType;
```

#### Appending Content

```java
// Append UI document to page root
builder.append("Pages/MyPage.ui");

// Append to specific container
builder.append("#container", "Components/Button.ui");

// Append inline UI markup (uses Hytale's UI markup syntax)
builder.appendInline("#container", "Label { Text: No items found; Style: (Alignment: Center); }");
```

> **Important:** The server does not validate inline UI markup; it is sent verbatim to the client. For complex layouts with images, custom panels, or backgrounds, prefer a `.ui` file in your plugin's asset pack.

#### Inserting Content

```java
// Insert before an element (recommended for complex UI)
builder.insertBefore("#target-element", "Components/Header.ui");

// Insert inline before an element (client-side markup string)
builder.insertBeforeInline("#target-element", "Label { Text: Header; Style: (FontSize: 18); }");
```

#### Removing and Clearing

```java
// Remove element from DOM entirely
builder.remove("#old-element");

// Clear element's children but keep element
builder.clear("#container");
```

#### Setting Values

```java
// Set text content
builder.set("#health-text", "100 HP");

// Set Message objects (for localized/formatted text)
builder.set("#greeting", message);

// Set numeric values
builder.set("#health-bar", 0.75f);  // float
builder.set("#count", 42);          // int
builder.set("#value", 3.14);        // double

// Set boolean values
builder.set("#is-visible", true);

// Set null value
builder.setNull("#optional-field");

// Set complex objects (must have a registered codec)
builder.setObject("#item-slot", itemGridSlot);

// Set arrays of compatible types
builder.set("#items", itemStackArray);

// Set lists of compatible types
builder.set("#items", itemStackList);
```

##### Supported Types

The `set()` method has dedicated overloads for these primitive types:

- `String` – Text values
- `boolean` – Boolean values
- `int` – Integer values
- `float` – Float values
- `double` – Double values
- `Message` – Localized/formatted messages (`com.hypixel.hytale.server.core.Message`)
- `Value<T>` – References to values in other UI documents

For `setObject()`, the following types are registered in the `CODEC_MAP`:

| Type                  | Package                                                      |
|-----------------------|--------------------------------------------------------------|
| `Area`                | `com.hypixel.hytale.server.core.ui.Area`                     |
| `ItemGridSlot`        | `com.hypixel.hytale.server.core.ui.ItemGridSlot`             |
| `ItemStack`           | `com.hypixel.hytale.server.core.inventory.ItemStack`         |
| `LocalizableString`   | `com.hypixel.hytale.server.core.ui.LocalizableString`        |
| `PatchStyle`          | `com.hypixel.hytale.server.core.ui.PatchStyle`               |
| `DropdownEntryInfo`   | `com.hypixel.hytale.server.core.ui.DropdownEntryInfo`        |
| `Anchor`              | `com.hypixel.hytale.server.core.ui.Anchor`                   |

> These types can also be used in arrays (`T[]`) or lists (`List<T>`) with the `set()` method.

#### Using Value References

Reference values from other UI documents using the `Value` class:

```java
import com.hypixel.hytale.server.core.ui.Value;

// Reference a style from Common.ui
builder.set("#button.Style", Value.ref("Common.ui", "DefaultButtonStyle"));

// Reference with nested path
builder.set("#panel.Theme", Value.ref("Themes.ui", "DarkTheme.Colors"));
```

The `Value` class supports two factory methods:

- `Value.ref(String documentPath, String valueName)` – Create a reference to a value in another UI document
- `Value.of(T value)` – Wrap a direct value (note: cannot be used with `set()` which only accepts references)

#### Getting Commands

```java
// Get array of commands to send
CustomUICommand[] commands = builder.getCommands();

// Empty array constant (useful when no commands needed)
CustomUICommand[] empty = UICommandBuilder.EMPTY_COMMAND_ARRAY;
```

### 11.2 UIEventBuilder

Bind UI events to server-side handlers.

#### Creating a Builder

```java
import com.hypixel.hytale.server.core.ui.builder.UIEventBuilder;

UIEventBuilder eventBuilder = new UIEventBuilder();
```

#### Event Types

These are the available `CustomUIEventBindingType` enum values from `com.hypixel.hytale.protocol.packets.interface_`:

| Type                             | Description                                         |
|----------------------------------|-----------------------------------------------------|
| `Activating`                     | Primary activation (click/tap)                      |
| `RightClicking`                  | Right mouse button click                            |
| `DoubleClicking`                 | Double click                                        |
| `MouseEntered`                   | Mouse entered element bounds                        |
| `MouseExited`                    | Mouse exited element bounds                         |
| `ValueChanged`                   | Value changed (sliders, inputs)                     |
| `ElementReordered`               | Element was reordered in a list                     |
| `Validating`                     | Validation event                                    |
| `Dismissing`                     | Page is being dismissed                             |
| `FocusGained`                    | Element gained focus                                |
| `FocusLost`                      | Element lost focus                                  |
| `KeyDown`                        | Key press event                                     |
| `MouseButtonReleased`            | Mouse button released                               |
| `SlotClicking`                   | Slot click (for inventory-style grids)              |
| `SlotDoubleClicking`             | Slot double click                                   |
| `SlotMouseEntered`               | Mouse entered slot                                  |
| `SlotMouseExited`                | Mouse exited slot                                   |
| `DragCancelled`                  | Drag operation cancelled                            |
| `Dropped`                        | Element was dropped                                 |
| `SlotMouseDragCompleted`         | Slot drag completed                                 |
| `SlotMouseDragExited`            | Slot drag exited                                    |
| `SlotClickReleaseWhileDragging`  | Slot click released while dragging                  |
| `SlotClickPressWhileDragging`    | Slot click pressed while dragging                   |
| `SelectedTabChanged`             | Tab selection changed                               |

```java
import com.hypixel.hytale.protocol.packets.interface_.CustomUIEventBindingType;
```

#### Basic Event Binding

```java
import com.hypixel.hytale.protocol.packets.interface_.CustomUIEventBindingType;

// Simple activation (click) binding
eventBuilder.addEventBinding(CustomUIEventBindingType.Activating, "#my-button");

// Value change binding for inputs
eventBuilder.addEventBinding(CustomUIEventBindingType.ValueChanged, "#slider");

// With explicit locking behavior (second parameter)
eventBuilder.addEventBinding(CustomUIEventBindingType.Activating, "#button", true); // locks interface
```

#### Events with Data

```java
import com.hypixel.hytale.server.core.ui.builder.EventData;

// Create event data (all values are stored as strings)
EventData data = new EventData()
    .append("Action", "submit")
    .append("ItemId", "123")
    .append("Quantity", "5");  // Note: numeric values must be strings

// Bind with data
eventBuilder.addEventBinding(CustomUIEventBindingType.Activating, "#submit-btn", data);
```

#### Non-Locking Events

By default, events lock the UI until the server responds (the `locksInterface` parameter defaults to `true`). For responsive UIs that shouldn't wait for server response, set `locksInterface` to `false`:

```java
// Non-locking event (doesn't block UI while waiting for server)
eventBuilder.addEventBinding(
    CustomUIEventBindingType.ValueChanged,
    "#slider",
    data,
    false  // locksInterface = false
);
```

#### Getting Event Bindings

```java
// Get array of bindings
CustomUIEventBinding[] bindings = eventBuilder.getEvents();

// Empty array constant (useful when no events needed)
CustomUIEventBinding[] empty = UIEventBuilder.EMPTY_EVENT_BINDING_ARRAY;
```

### 11.3 EventData

`EventData` is a record that wraps a `Map<String, String>` for passing key-value parameters with events.

```java
public record EventData(Map<String, String> events) { ... }
```

#### Creating EventData

```java
import com.hypixel.hytale.server.core.ui.builder.EventData;

// Create empty event data using no-arg constructor
EventData data = new EventData()
    .append("Key1", "value1")
    .append("Key2", "value2")
    .append("Count", "42");

// Create with initial value using factory method
EventData data = EventData.of("Action", "confirm");

// Append enum values (converted to enum name string)
data.append("Direction", Direction.NORTH);  // stores "NORTH"

// Create with an existing map
Map<String, String> existingMap = new HashMap<>();
existingMap.put("Key", "value");
EventData data = new EventData(existingMap);
```

#### Available Methods

| Method                                         | Description                                                       |
|------------------------------------------------|-------------------------------------------------------------------|
| `new EventData()`                              | Create empty event data (uses `Object2ObjectOpenHashMap`)          |
| `new EventData(Map<String, String>)`           | Create with an existing map                                       |
| `EventData.of(String key, String value)`       | Factory method to create with initial key-value pair              |
| `append(String key, String value)`             | Add a string value (returns `this` for chaining)                  |
| `append(String key, Enum<?> enumValue)`        | Add an enum value (stored as `enumValue.name()`)                  |
| `put(String key, String value)`                | Alias for `append` (returns `this` for chaining)                  |
| `events()`                                     | Get the underlying `Map<String, String>`                          |

#### Supported Value Types

All values are stored as strings in the underlying map:

- `String` – Text values (stored directly)
- `Enum<T>` – Enum constants (serialized via `name()` method)

> **Note:** If you decode event data with `KeyedCodec` (as in `InteractiveCustomUIPage`), any key that starts with a letter must be uppercase.

### 11.4 Complete Example

A custom interactive page with event handling:

```java
import com.hypixel.hytale.codec.builder.BuilderCodec;
import com.hypixel.hytale.component.Ref;
import com.hypixel.hytale.component.Store;
import com.hypixel.hytale.protocol.packets.interface_.CustomPageLifetime;
import com.hypixel.hytale.protocol.packets.interface_.CustomUIEventBindingType;
import com.hypixel.hytale.server.core.entity.entities.player.pages.InteractiveCustomUIPage;
import com.hypixel.hytale.server.core.ui.builder.EventData;
import com.hypixel.hytale.server.core.ui.builder.UICommandBuilder;
import com.hypixel.hytale.server.core.ui.builder.UIEventBuilder;
import com.hypixel.hytale.server.core.universe.PlayerRef;
import com.hypixel.hytale.server.core.universe.world.storage.EntityStore;
import java.util.List;

public class ShopPage extends InteractiveCustomUIPage<ShopEventData> {
    private final List<ShopItem> items;

    public ShopPage(PlayerRef playerRef, List<ShopItem> items, BuilderCodec<ShopEventData> codec) {
        super(playerRef, CustomPageLifetime.CanDismiss, codec);
        this.items = items;
    }

    @Override
    public void build(Ref<EntityStore> ref, UICommandBuilder commands,
                      UIEventBuilder events, Store<EntityStore> store) {
        // Load page template
        commands.append("Pages/ShopPage.ui");
        commands.set("#shop-title", "Item Shop");

        // Add items dynamically
        for (int i = 0; i < items.size(); i++) {
            ShopItem item = items.get(i);

            // Append item template
            commands.append("#item-list", "Components/ShopItem.ui");
            commands.set("#item-" + i + "-name", item.getName());
            commands.set("#item-" + i + "-price", item.getPrice() + " coins");

            // Bind purchase event (note: index must be string)
            events.addEventBinding(
                CustomUIEventBindingType.Activating,
                "#buy-btn-" + i,
                EventData.of("Action", "buy").append("Index", String.valueOf(i))
            );
        }

        // Bind close button
        events.addEventBinding(CustomUIEventBindingType.Activating, "#close-btn");
    }

    @Override
    public void handleDataEvent(Ref<EntityStore> ref, Store<EntityStore> store,
                                ShopEventData data) {
        if ("buy".equals(data.action())) {
            int index = Integer.parseInt(data.index());
            ShopItem item = items.get(index);
            // Process purchase...

            // Update UI
            UICommandBuilder update = new UICommandBuilder();
            update.set("#balance", newBalance + " coins");
            sendUpdate(update, null, false);
        } else {
            close();
        }
    }
}
```

#### CustomPageLifetime Options

The `CustomPageLifetime` enum controls how the page can be closed:

| Value                                    | Description                                                  |
|------------------------------------------|--------------------------------------------------------------|
| `CantClose`                              | Page cannot be closed by user                                |
| `CanDismiss`                             | Page can be dismissed (e.g., pressing Escape)                |
| `CanDismissOrCloseThroughInteraction`    | Page can be dismissed or closed through in-game interaction  |

### 11.5 UI Markup Syntax

Hytale uses a custom markup syntax for `.ui` files and inline UI. **This is NOT HTML** – it uses a curly-brace format:

#### Basic Syntax

```
ElementType {
    PropertyName: value;
    PropertyName2: (NestedKey: value; NestedKey2: value);
}
```

#### Inline Markup Examples

Inline UI markup (`appendInline`, `insertBeforeInline`) is interpreted by the client; the server does not validate which element types are accepted. Common examples:

| Element  | Description       | Example                                                          |
|----------|-------------------|------------------------------------------------------------------|
| `Label`  | Text display      | `Label { Text: Hello; Style: (Alignment: Center); }`            |
| `Group`  | Container         | `Group { LayoutMode: Left; Anchor: (Bottom: 0); }`             |

#### Example Inline Markup

```java
// Simple label
builder.appendInline("#container", "Label { Text: No items found; Style: (Alignment: Center); }");

// Group container
builder.appendInline("#list", "Group { LayoutMode: Left; Anchor: (Bottom: 0); }");

// Localized text (use % prefix for translation keys)
builder.appendInline("#messages", "Label { Text: %customUI.noItems; Style: (Alignment: Center); }");
```

#### Custom .ui Files

For complex UI elements (panels, images, buttons), create `.ui` files in your plugin's asset pack:

1. Set `"IncludesAssetPack": true` in your plugin's `manifest.json`
2. Create `.ui` files in `src/main/resources/Common/UI/Custom/`
3. Reference them using `append()` or `insertBefore()`

**Directory structure:**

```
src/main/resources/
├── manifest.json                          # IncludesAssetPack: true
└── Common/
    └── UI/
        └── Custom/
            ├── MyCustomPanel.ui           # Your .ui files
            └── MyBackground.png           # Textures
```

**Loading textures:** Texture paths in `.ui` files are **relative to the .ui file location**. Use `PatchStyle()` to define textures and apply them as backgrounds:

```
// Include Common.ui to access built-in styles
$Common = "Common.ui";

// Define a texture variable (path relative to this .ui file)
@MyTex = PatchStyle(TexturePath: "MyBackground.png");

Group {
    LayoutMode: Center;

    Group #MyPanel {
        Background: @MyTex;
        Anchor: (Width: 800, Height: 1000);
        LayoutMode: Top;
    }
}
```

**Important notes:**

- Place textures in the **same folder** as your `.ui` file for simplest relative paths.
- The texture will automatically stretch to fit the element size.
- Import `Common.ui` using `$Common = "Common.ui";` to access built-in styles.
- Reference styles with `Style: $Common.@DefaultInputFieldStyle;`.

```java
// Reference the custom .ui file from Java
builder.append("Custom/MyCustomPanel.ui");
```

### 11.6 Best Practices

1. **Batch updates** – Combine multiple `set()` calls in one builder.
2. **Use non-locking events** for frequent updates like sliders.
3. **Reference styles** from `Common.ui` for consistency.
4. **Clear before append** when replacing dynamic content.
5. **Handle event data validation** – Clients can send malformed data.
6. **Use `.ui` files for complex layouts** – Inline markup is limited to simple elements.
7. **Include asset pack for images** – Set `IncludesAssetPack: true` in `manifest.json`.
8. **Place textures with `.ui` files** – Put image files in the same directory as your `.ui` files for easy relative paths.
9. **Use PatchStyle for textures** – Define textures with `@MyTex = PatchStyle(TexturePath: "file.png");` and apply with `Background: @MyTex;`.

---

*This document consolidates the full GUI System reference from [hytale-docs.pages.dev](https://hytale-docs.pages.dev/gui/). For the latest updates, refer to the source.*