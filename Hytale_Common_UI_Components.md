# Common.ui Components Reference | HytaleDocs

> *Import with:* `$C = "../Common.ui";`

---

## Table of Contents

1. [Button Components](#1-button-components)
2. [Input Components](#2-input-components)
3. [Container Components](#3-container-components)
4. [Layout Components](#4-layout-components)
5. [Text Components](#5-text-components)
6. [Utility Components](#6-utility-components)
7. [Style Constants](#7-style-constants)
8. [Styles](#8-styles)
   - [Button Styles](#81-button-styles)
   - [Label Styles](#82-label-styles)
   - [Input Styles](#83-input-styles)
   - [Other Styles](#84-other-styles)

---

## 1. Button Components

| Component | Parameters | Description |
|---|---|---|
| `@TextButton` | `@Text`, `@Anchor`, `@Sounds` | Primary button (blue) |
| `@SecondaryTextButton` | `@Text`, `@Anchor`, `@Sounds` | Secondary button (gray) |
| `@TertiaryTextButton` | `@Text`, `@Anchor`, `@Sounds` | Tertiary button |
| `@CancelTextButton` | `@Text`, `@Anchor`, `@Sounds` | Destructive button (red) |
| `@SmallSecondaryTextButton` | `@Text`, `@Anchor`, `@Sounds` | Small secondary |
| `@SmallTertiaryTextButton` | `@Text`, `@Anchor`, `@Sounds` | Small tertiary |
| `@Button` | `@Anchor`, `@Sounds` | Icon button (no text) |
| `@SecondaryButton` | `@Anchor`, `@Sounds`, `@Width` | Secondary icon button |
| `@TertiaryButton` | `@Anchor`, `@Sounds`, `@Width` | Tertiary icon button |
| `@CancelButton` | `@Anchor`, `@Sounds`, `@Width` | Cancel icon button |
| `@CloseButton` | — | Pre-styled close button (32×32) |
| `@BackButton` | — | Pre-styled back button |

### Usage

```
$C.@TextButton #SaveBtn {
  @Text = "Save";
  Anchor: (Width: 120, Height: 44);
}

$C.@SecondaryTextButton #CancelBtn {
  @Text = "Cancel";
  Anchor: (Width: 100, Height: 44);
}

$C.@CancelTextButton #DeleteBtn {
  @Text = "Delete";
  Anchor: (Width: 100, Height: 44);
}
```

---

## 2. Input Components

| Component | Parameters | Description |
|---|---|---|
| `@TextField` | `@Anchor` | Text input (height: 38) |
| `@NumberField` | `@Anchor` | Numeric input (height: 38) |
| `@DropdownBox` | `@Anchor` | Dropdown selector |
| `@CheckBox` | — | Checkbox only (22×22) |
| `@CheckBoxWithLabel` | `@Text`, `@Checked` | Checkbox with label |

### Usage

```
$C.@TextField #NameInput {
  FlexWeight: 1;
  PlaceholderText: "Enter name...";
}

$C.@NumberField #AmountInput {
  Anchor: (Width: 80);
  Value: 100;
}

$C.@CheckBoxWithLabel #EnableOption {
  @Text = "Enable feature";
  @Checked = true;
  Anchor: (Height: 28);
}

$C.@DropdownBox #CategorySelect {
  Anchor: (Width: 200, Height: 32);
}
```

---

## 3. Container Components

| Component | Parameters | Description |
|---|---|---|
| `@Container` | `@ContentPadding`, `@CloseButton` | Styled container with title |
| `@DecoratedContainer` | `@ContentPadding`, `@CloseButton` | Container with decorative border |
| `@Panel` | — | Simple panel with border |
| `@PageOverlay` | — | Semi-transparent background |

### Structure

```
$C.@Container {
  @CloseButton = true;
  Anchor: (Width: 400, Height: 300);

  // Has #Title and #Content areas
}
```

---

## 4. Layout Components

| Component | Parameters | Description |
|---|---|---|
| `@ContentSeparator` | `@Anchor` | Horizontal line (height: 1) |
| `@VerticalSeparator` | — | Vertical line (width: 6) |
| `@HeaderSeparator` | — | Header section separator |
| `@PanelSeparatorFancy` | `@Anchor` | Decorative separator |
| `@ActionButtonContainer` | — | Container for action buttons |
| `@ActionButtonSeparator` | — | Space between action buttons |

---

## 5. Text Components

| Component | Parameters | Description |
|---|---|---|
| `@Title` | `@Text`, `@Alignment` | Styled title label |
| `@Subtitle` | `@Text` | Styled subtitle |
| `@TitleLabel` | — | Large centered title (40px) |
| `@PanelTitle` | `@Text`, `@Alignment` | Panel section title |

---

## 6. Utility Components

| Component | Parameters | Description |
|---|---|---|
| `@DefaultSpinner` | `@Anchor` | Loading spinner (32×32) |
| `@HeaderSearch` | `@MarginRight` | Search input with icon |

---

## 7. Style Constants

```
@PrimaryButtonHeight       = 44;
@SmallButtonHeight         = 32;
@BigButtonHeight           = 48;
@ButtonPadding             = 24;
@DefaultButtonMinWidth     = 172;
@ButtonBorder              = 12;
@DropdownBoxHeight         = 32;
@TitleHeight               = 38;
@InnerPaddingValue         = 8;
@FullPaddingValue          = 17;
@DisabledColor             = #797b7c;
```

---

## 8. Styles

### 8.1 Button Styles

| Style | Description |
|---|---|
| `@DefaultTextButtonStyle` | Primary button |
| `@SecondaryTextButtonStyle` | Secondary button |
| `@TertiaryTextButtonStyle` | Tertiary button |
| `@CancelTextButtonStyle` | Destructive / cancel |
| `@SmallDefaultTextButtonStyle` | Small primary |
| `@SmallSecondaryTextButtonStyle` | Small secondary |
| `@DefaultButtonStyle` | Icon button |
| `@SecondaryButtonStyle` | Secondary icon |
| `@TertiaryButtonStyle` | Tertiary icon |
| `@CancelButtonStyle` | Cancel icon |

### 8.2 Label Styles

| Style | Properties |
|---|---|
| `@DefaultLabelStyle` | FontSize: 16, TextColor: `#96a9be` |
| `@DefaultButtonLabelStyle` | FontSize: 17, Bold, Uppercase, Center |
| `@TitleStyle` | FontSize: 15, Bold, Uppercase, `#b4c8c9` |
| `@SubtitleStyle` | FontSize: 15, Uppercase, `#96a9be` |
| `@PopupTitleStyle` | FontSize: 38, Bold, Uppercase, Center |

### 8.3 Input Styles

| Style | Description |
|---|---|
| `@DefaultInputFieldStyle` | Text input styling |
| `@DefaultInputFieldPlaceholderStyle` | Placeholder text (`#6e7da1`) |
| `@InputBoxBackground` | Input background |
| `@InputBoxHoveredBackground` | Hover state |
| `@InputBoxSelectedBackground` | Selected state |

### 8.4 Other Styles

| Style | Description |
|---|---|
| `@DefaultScrollbarStyle` | Scrollbar styling |
| `@DefaultCheckBoxStyle` | Checkbox styling |
| `@DefaultDropdownBoxStyle` | Dropdown styling |
| `@DefaultSliderStyle` | Slider styling |
| `@DefaultTextTooltipStyle` | Tooltip styling |
| `@DefaultColorPickerStyle` | Color picker styling |
