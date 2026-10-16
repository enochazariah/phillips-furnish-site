# Phillips Furnish Limited Website

A responsive website for Phillips Furnish Limited, focused on furniture and furnishing. This is not a shop.

## Requirements

- Node.js 20 or later
- No third-party runtime packages

## Commands

Run these from the project directory in PowerShell:

```powershell
npm.cmd install
npm.cmd run start
```

Open `http://localhost:4173` in a browser. Stop the server with `Ctrl+C`.

Run the automated checks:

```powershell
npm.cmd test
```

Create a static production copy in `dist/`:

```powershell
npm.cmd run build
```

`npm.cmd install` is included for a predictable setup command; this project currently has no external dependencies.

## Site content

- `content/site-content.json` contains unset contact fields and the local-only message behavior. No company email or phone has been supplied, and the form does not transmit data.
- `assets/manifest.json` records gallery sources, credits, categories, license information and per-image verification notes.
- The five image categories are room references only. Every image is licensed editorial stock imagery, not a Phillips Furnish Limited project.
- Ten client comments supplied by the user are displayed with the supplied attributions. Their accuracy and permission to publish have not been independently verified.

## Before publication

Confirm the company description, actual services, location/service area and contact details. Confirm the testimonial wording, attributions and permission to publish. Replace stock references with company project photography only when available and approved. Configure a verified contact destination before enabling message delivery.

See `BUILD_STATUS.md` for verified work and remaining company confirmations.