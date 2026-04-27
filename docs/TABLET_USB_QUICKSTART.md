# Tablet USB Quickstart (Galaxy Tab + Termux)

## 1) Create bundle on Windows

Run from PowerShell in project root:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/prepare-usb-bundle.ps1
```

Output ZIP:

- dist-tablet/inventory-system-tablet-usb.zip

## 2) Copy by USB

- Connect tablet with USB cable.
- Set USB mode to File Transfer (MTP).
- Copy ZIP to Download folder.
- Extract ZIP so you get Download/inventory-system (or similar).

## 3) One-time setup in Termux

```bash
termux-setup-storage
cp -r /storage/emulated/0/Download/inventory-system ~/
cd ~/inventory-system
bash scripts/setup-termux.sh
```

## 4) Daily start

```bash
cd ~/inventory-system
bash scripts/start-termux.sh
```

Open browser:

- http://localhost:3000

## 5) App-like launch (single device)

In Chrome or Samsung Browser:

- Open http://localhost:3000
- Menu -> Add to Home screen

This gives you a home icon and standalone window style (app-like UX) while still using local Next.js + SQLite.

## Important note about "native"

This repository is Next.js server app (Node + Prisma + SQLite). It cannot be converted to a true Android native APK without a separate mobile app wrapper or rewrite. The setup above is the fastest reliable single-device approach.
