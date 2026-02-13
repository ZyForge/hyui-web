# Hytale UI Syntax Documentation (.ui)

> **Note:** Hytale uses a custom declarative markup language similar to HSON/CSS. This reference defines the strict syntax rules, layout systems, and styling definitions required to create valid `.ui` files.

---

## 1. Basic Structure & Syntax

### File Anatomy
* **Elements:** Declared using `ElementType { ... }` blocks.
* **Properties:** Defined as `Key: Value;`. All properties must end with a semicolon `;`.
* **Nested Properties:** Complex values are grouped in parentheses `(Key: Value, Key2: Value)`.
* **Comments:** Support standard C-style comments (though not explicitly detailed in the text, standard practice in Hytale's configuration files).

### Imports
Reuse styles and components from other files using the `$` prefix. Paths are relative to the current file.

```javascript
// Import the standard library (Common.ui)
$Common = "Common.ui"; 

// Import a local theme file
$Theme = "Theme/DarkTheme.ui";

```

### Variables

Variables are prefixed with `@`. They are used to define reusable values, constants, or parameters passed into components.

```javascript
// Defining a variable
@PrimaryColor = #FF5555;

// Using a variable
TextColor: @PrimaryColor;

```

---

## 2. Layout System

The layout system is controlled by the `Group` container, `LayoutMode`, and `Anchor` properties.

### Containers

* **`Group`**: The fundamental container element for organizing children.

### Layout Modes

Defines how children are arranged within a Group.

| Mode | Description |
| --- | --- |
| `Top` | Stacks elements vertically (Column). |
| `Left` | Arranges elements horizontally (Row). |
| `Center` | Centers elements within the container. |
| `Right` | Aligns elements to the right. |
| `TopScrolling` | Vertical stack with scrolling enabled. |

### Anchors (Positioning & Sizing)

The `Anchor` property defines the size and position of an element relative to its parent.

* **Fixed Size:**
```javascript
Anchor: (Width: 200, Height: 50);

```


* **Stretching (Fill):**
```javascript
Anchor: (Top: 0, Bottom: 0, Left: 0, Right: 0);

```


* **Alignment/Docking:**
```javascript
Anchor: (Top: 10, Right: 10); // Dock top-right with margin

```



### Padding & Spacing

* **`FlexWeight`**: Used in linear layouts (`Top`, `Left`) to determine how much available space an element consumes relative to siblings.
* *Example:* `FlexWeight: 1;`


* **`ContentPadding`**: Defines internal spacing for containers (often used in `Common.ui` components).
* *Syntax:* `(Full: 10)` or `(Top: 5, Bottom: 5, Left: 10, Right: 10)`.



---

## 3. Styling Elements

Styles are defined using specific functions or maps.

### Colors

* **Hex:** `#RRGGBB` (e.g., `#FFFFFF`).
* **Hex + Alpha:** `#RRGGBB(Alpha)` where Alpha is a float `0.0`–`1.0` (e.g., `#000000(0.5)`).

### Label Styles

Used for `Label` elements or text within buttons.

**Syntax:** `LabelStyle(...)`

| Property | Type | Description |
| --- | --- | --- |
| `FontSize` | Integer | Size of the text (e.g., `16`, `18`). |
| `TextColor` | Color | Hex color code. |
| `RenderUppercase` | Boolean | Forces text to uppercase. |
| `HorizontalAlignment` | Enum | `Start`, `Center`, `End`. |
| `VerticalAlignment` | Enum | `Start`, `Center`, `End`. |
| `Bold` | Boolean | Optional bold weight. |

**Example:**

```javascript
@MyLabelStyle = LabelStyle(
    FontSize: 18, 
    TextColor: #b4c8c9, 
    HorizontalAlignment: Center, 
    RenderUppercase: true
);

```

### Button Styles

Buttons use a state map defining appearance for interaction states: `Default`, `Hovered`, `Pressed`, and `Disabled`.

**Structure:**

```javascript
@MyButtonStyle = (
    Default:  (Background: #333333, LabelStyle: @MyLabelStyle),
    Hovered:  (Background: #444444, LabelStyle: @MyLabelStyle),
    Pressed:  (Background: #222222, LabelStyle: @MyLabelStyle),
    Disabled: (Background: #111111, LabelStyle: @DisabledLabelStyle)
);

```

### Images & Textures

Textures are applied using `PatchStyle`. Paths are **relative** to the `.ui` file.

**Syntax:** `PatchStyle(TexturePath: "Path/Image.png")`

```javascript
@BgTexture = PatchStyle(TexturePath: "textures/panel.png");

Group #Panel {
    Background: @BgTexture;
}

```

---

## 4. Common.ui Components

Hytale provides the `Common.ui` library for standard components. You should use these instead of raw elements when possible.

**Import:** `$C = "Common.ui";` (Assuming Common.ui is in the same directory or adjust path).

| Component | Parameters | Description |
| --- | --- | --- |
| **`$C.@TextButton`** | `@Text`, `@Anchor`, `@Sounds` | Standard blue button. |
| **`$C.@SecondaryTextButton`** | `@Text`, `@Anchor` | Grey secondary button. |
| **`$C.@CancelTextButton`** | `@Text`, `@Anchor` | Red destructive button. |
| **`$C.@TextField`** | `@Anchor`, `PlaceholderText` | Text input field. |
| **`$C.@Container`** | `@CloseButton` (bool), `@ContentPadding` | Window with title bar. |
| **`$C.@Panel`** | N/A | Simple bordered panel background. |
| **`$C.@CheckBoxWithLabel`** | `@Text`, `@Checked` | Checkbox with text. |

---

## 5. Complete Example

This example demonstrates a complete window using imports, variables, styles, and Java-binding IDs.

```javascript
// 1. Imports
$C = "Common.ui";

// 2. Constants & Styles
@WindowWidth = 400;
@HeaderStyle = LabelStyle(
    FontSize: 20,
    TextColor: #FFFFFF,
    HorizontalAlignment: Center
);

// 3. Root Element
Group {
    LayoutMode: Center; // Center the window on screen
    
    // 4. Main Window Container
    $C.@Container #MyWindow {
        Anchor: (Width: @WindowWidth, Height: 300);
        @CloseButton = true; // Enables the 'X' button
        
        // 5. Title (Standard ID for Container)
        Label #Title {
            Text: "MY SETTINGS";
        }
        
        // 6. Content Area
        Group #Content {
            LayoutMode: Top; // Stack items vertically
            @ContentPadding = (Full: 10);
            
            // Header
            Label #StatusLabel {
                Style: @HeaderStyle;
                Text: "Status: OK";
                Anchor: (Height: 30, Left: 0, Right: 0);
            }
            
            // Input
            $C.@TextField #NameInput {
                PlaceholderText: "Enter Username...";
                Anchor: (Height: 38, Left: 0, Right: 0);
            }
            
            // Spacer
            Group { Anchor: (Height: 10); }
            
            // Action Button
            $C.@TextButton #SaveBtn {
                @Text = "SAVE CHANGES";
                Anchor: (Height: 44, Left: 0, Right: 0);
            }
        }
    }
}

```

## 6. Java Integration (IDs)

The `#IDs` defined in the `.ui` file are used by the Java `UICommandBuilder` to modify elements at runtime.

| UI Definition | Java Command |
| --- | --- |
| `Label #StatusLabel` | `builder.set("#StatusLabel.Text", "Status: Error");` |
| `$C.@TextField #NameInput` | `builder.set("#NameInput.Text", player.getName());` |
| `Group #Content` | `builder.set("#Content.Visible", false);` |

**Rules:**

1. **Exact Match:** IDs must match exactly (case-sensitive).
2. **Stable IDs:** Do not change IDs in the `.ui` file without updating the Java code.
3. **Property Access:** Use dot notation (`#ID.Property`) to target specific attributes.

```