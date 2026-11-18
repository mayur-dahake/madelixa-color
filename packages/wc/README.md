# @madelixa/color-wc

> Framework-agnostic Form-Associated Custom Element `<madelixa-color-picker>` built with Lit and Shadow DOM.

Part of the **Madelixa Color Picker** monorepo suite by [MADELIXA](https://github.com/mayur-dahake/madelixa-color) (Author: Mayur Dahake).

## Features

- **Framework Agnostic**: Works anywhere — React, Vue, Svelte, Angular, Solid, or vanilla HTML.
- **Form-Associated Custom Element (FACE)**: Integrates natively with HTML `<form>` submission and `FormData`.
- **Encapsulated Shadow DOM**: Isolated styles with CSS Custom Properties theming.
- **Retina Canvas & Keyboard ARIA**: High-DPI canvas rendering and full arrow-key navigation.

## Installation

```bash
npm install @madelixa/color-wc
# or
pnpm add @madelixa/color-wc
```

## Quick Start

### 1. In Vanilla HTML / Scripts

```html
<script type="module" src="https://unpkg.com/@madelixa/color-wc"></script>

<form action="/api/theme" method="POST">
  <label for="color">Theme Color:</label>
  <madelixa-color-picker
    id="color"
    name="themeColor"
    value="#3b82f6"
    format="oklch"
  ></madelixa-color-picker>

  <button type="submit">Submit</button>
</form>

<script>
  const picker = document.querySelector('madelixa-color-picker');
  picker.addEventListener('change', (e) => {
    console.log('New color selected:', e.detail.value);
  });
</script>
```

### 2. In JavaScript / TypeScript Applications

```typescript
import '@madelixa/color-wc';

// Automatically registered as <madelixa-color-picker>
```

## Attributes & Properties

| Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `string` | `'#3b82f6'` | Current color string in hex, oklch, or rgb format |
| `format` | `'hex' \| 'rgb' \| 'oklch' \| 'p3'` | `'hex'` | Default output string format |
| `inline` | `boolean` | `false` | When true, renders inline without a popover |
| `disabled` | `boolean` | `false` | Disables interaction |
| `name` | `string` | `''` | Form input name when placed inside `<form>` |

## License

MIT © [MADELIXA](https://github.com/mayur-dahake/madelixa-color)
