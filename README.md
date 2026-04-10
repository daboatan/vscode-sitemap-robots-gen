# SEO File Generator (Private)

This VS Code extension generates these two files in the same folder as your currently opened HTML file:

- `robots.txt`
- `sitemap.xml`

It reads the canonical URL from the active HTML file, for example:

```html
<link rel="canonical" href="https://3peakscrossfit.com/member-reviews/">
```

## What it does

When you run the command:

- it checks the currently active file
- it extracts the canonical URL
- it creates `robots.txt` in the same directory
- it creates `sitemap.xml` in the same directory

## Generated output

### robots.txt

```txt
User-agent: *
Allow: /

Sitemap: https://3peakscrossfit.com/member-reviews/sitemap.xml
```

### sitemap.xml

Contains one URL entry based on the canonical URL.

## Install locally

### Option 1: Run in Extension Development Host

1. Open this extension folder in VS Code
2. Press `F5`
3. In the new VS Code window, open any `.html` file containing a canonical tag
4. Run:
   - `SEO: Generate sitemap.xml and robots.txt`

### Option 2: Package to VSIX

Install packaging tool:

```powershell
npm install
npx vsce package
```

Then install the generated `.vsix` file in VS Code.

## Command name

- `SEO: Generate sitemap.xml and robots.txt`

## Notes

- The HTML file must already be saved.
- The canonical URL must be present.
- The extension normalizes the canonical URL to end with `/` before generating the sitemap URL.


## Button integration

This version adds a clickable button in the editor title bar when an `.html` or `.htm` file is open. It also works from the Explorer right-click menu.
