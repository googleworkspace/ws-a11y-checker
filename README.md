# Google Workspace Accessibility Checker Add-on

A Google Workspace Add-on for **Google Docs** and **Google Slides** that scans documents and presentations for accessibility barriers, verifying alignment with **WCAG 2.1 Level AA** standards and providing 1-click automated remediations.

---

## 🌟 Key Features

- **Comprehensive WCAG 2.1 AA Audit Engine**: Scans text contrast, heading hierarchies, ambiguous links, image alt text, table header styling, typography, line spacing, empty paragraph spacers, and slide z-index reading order.
- **1-Click Auto-Remediation**: Instantly repairs accessibility issues directly on your document canvas (e.g. converting simulated headings to semantic $H_1/H_2$, adjusting low-contrast text colors, fixing justified text alignment, styling data table headers).
- **Material Design 3 Sidebar UI**: Built with Angular 18 (Zoneless Change Detection) featuring authentic Google Workspace styling, Google Sans typography, and responsive surface cards.
- **Interactive Severity Filtering**: Clickable stat dashboards and Material filter chips allowing users to isolate findings by **Error**, **Warning**, or **Notice** severity tiers.
- **Multi-Language Internationalization (`i18n`)**: Auto-detects the user's active Google Workspace locale with built-in translations for **English (`en`)**, **Spanish (`es`)**, **French (`fr`)**, **German (`de`)**, and **Japanese (`ja`)**, plus manual language override in Preferences.
- **Dynamic Test Suite Generator**: Generates comprehensive demo test suites directly inside Google Docs or Slides (appending non-destructively to preserve existing user content).

---

## 📋 Supported WCAG 2.1 AA Rules

| WCAG Rule | Category | Description | Auto-Fix Available |
| :--- | :--- | :--- | :---: |
| **WCAG 1.4.3** | Color Contrast (Minimum) | Ensures text maintains $\ge 4.5:1$ contrast ratio (or $\ge 3:1$ for large 18pt+ text) against background fills. | Yes |
| **WCAG 1.3.1** | Info & Relationships (Headings) | Enforces logical heading hierarchies without rank skips ($H_1 \to H_2 \to H_3$) and flags top-of-doc faux headings. | Yes |
| **WCAG 1.3.1** | Info & Relationships (Spacers) | Identifies consecutive empty paragraphs used as visual line breaks (which announce repeatedly as "blank" on screen readers). | Yes |
| **WCAG 1.3.1** | Info & Relationships (Tables) | Flags data tables lacking visually distinguished header rows. | Yes |
| **WCAG 2.4.4** | Link Purpose (In Context) | Detects uninformative link text (`"click here"`, `"learn more"`, `"this"`, `"file"`) and raw URL literals. | Manual |
| **WCAG 1.1.1** | Non-text Content | Flags missing alternative text on images and warns against redundant prefixes like `"image of"`. | Manual |
| **WCAG 1.4.8** | Visual Presentation | Flags justified text alignment (`JUSTIFY`), which creates irregular word spacing rivers that disrupt reading. | Yes |
| **WCAG 1.4.12**| Text Spacing | Flags cramped paragraph line spacing ($< 1.15\times$). | Yes |
| **WCAG 2.4.6** | Headings & Labels | Flags generic or uninformative section headings (`"Section"`, `"Details"`). | Manual |
| **WCAG 1.3.2** | Meaningful Sequence (Slides) | Displays an interactive Drag-and-Drop / Keyboard editor to adjust slide object z-index reading order. | Yes |

---

## 🛠️ Architecture & Tech Stack

```
a11ychecker/
├── backend/                  # Google Apps Script Backend (TypeScript)
│   ├── src/
│   │   ├── checks/           # Modular WCAG check functions
│   │   ├── models/           # Data models (Issue, Settings)
│   │   ├── utils/            # Luminance & contrast math utilities
│   │   └── Code.ts           # RPC entry points & test suite generator
│   └── tsconfig.json
├── ui/                       # Frontend UI (Angular 18 Zoneless SPA)
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/   # Dashboard, IssueList, HelpModal, Settings, ReadingOrder
│   │   │   └── services/     # AccessibilityService, I18nService, GoogleScriptService
│   │   └── styles.css        # Material Design 3 Global Theme
│   └── angular.json
├── scripts/
│   ├── build-backend.js      # Bundles backend TS into dist/Code.js via esbuild
│   └── build-bundle.js       # Bundles compiled Angular UI into single dist/sidebar.html
├── appsscript.json           # Least-privilege manifest configuration
└── package.json              # Root npm build & deploy pipeline
```

- **Backend**: TypeScript compiled with `esbuild` into a single standalone IIFE (`dist/Code.js`) exposing global Google Apps Script RPC handlers.
- **Frontend**: Angular 18 utilizing `provideExperimentalZonelessChangeDetection()` to prevent iframe microtask collisions inside Google Apps Script sandboxed iframes.
- **Manifest**: Least-privilege OAuth scopes restricted strictly to `documents.currentonly`, `presentations.currentonly`, and `script.container.ui`.

---

## 🚀 Getting Started & Local Development

### Prerequisites

- **Node.js** (v18 or higher)
- **Google Clasp** (`npm install -g @google/clasp`)
- Logged in to clasp with access to your Google Apps Script project (`clasp login`)

### Installation & Build Commands

1. **Clone the repository**:
   ```bash
   git clone https://github.com/googleworkspace/ws-a11y-checker.git
   cd ws-a11y-checker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run Unit Test Suite**:
   ```bash
   npm test
   ```

4. **Build backend and frontend**:
   ```bash
   npm run build
   ```

5. **Deploy to Google Apps Script**:
   ```bash
   npm run push
   ```

---

## 🏛️ Institutional Launch & Deployment (Domain-Wide)

For schools, universities, and enterprise institutions wishing to launch the **Accessibility Checker** for all domain users as a private Google Workspace Add-on:

1. **Self-Contained & Private**: The add-on runs entirely within your institution's Google Apps Script and Google Cloud Platform (GCP) project without external third-party data processing.
2. **Step-by-Step Administrator Guide**: Follow our comprehensive [Institutional Deployment Guide (DEPLOYMENT.md)](DEPLOYMENT.md) for full instructions on:
   - Creating and linking the GCP Project & OAuth Consent Screen (**Internal** user type).
   - Configuring the Google Workspace Marketplace SDK with private domain visibility.
   - Force-installing or allowing self-service installation across the entire domain or specific Organizational Units (OUs) via the **Google Workspace Admin Console** (`admin.google.com`).

---

## 🌐 Internationalization (i18n)

The extension supports multi-language display across all UI components and reports:
- **Automatic Detection**: Reads `Session.getActiveUserLocale()` from Google Workspace.
- **Supported Languages**: English (`en`), Spanish (`es`), French (`fr`), German (`de`), Japanese (`ja`).
- **Manual Override**: Change display language at any time in **Settings** $\to$ **Interface Language**.

---

## 📜 License

Licensed under the [Apache License, Version 2.0](LICENSE).

