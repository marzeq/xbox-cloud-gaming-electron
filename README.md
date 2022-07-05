# About

**This is a fork of the** [**geforcenow-electron app**](https://github.com/hmlendea/geforcenow-electron) written in Electron, that wraps around the Xbox Cloud Gaming web browser implementation.

## Installation

[![Get it from the AUR](https://raw.githubusercontent.com/hmlendea/readme-assets/master/badges/stores/aur.png)](https://aur.archlinux.org/packages/geforcenow-electron/)

Currently the project is available on these repositories: **AUR**

## Manual Installation

-   Go to the [latest release](https://github.com/marzeq/xbox-cloud-gaming-electron/releases/latest).
-   Download the specific file that best fits your disto.
-   Install it

# Usage

If you've installed it through your package manager, then it should already contain a launcher for it. Otherwise, run the `xbox-cloud-gaming-electron` binary.

To toggle full-screen mode, use the `F11` keyboard shortcut.

# Building from source

## Requirements

You will need to install [npm](https://www.npmjs.com/), the Node.js package manager. On most distributions, the package is simply called `npm`.

## Cloning the source code

Once you have npm, clone the wrapper to a convenient location:

```
git clone https://github.com/marzeq/xbox-cloud-gaming-electron.git
```

## Building

```
cd xbox-cloud-gaming-electron
npm install yarn
npx yarn
npx yarn build
```

On subsequent runs, `npx yarn build` will be all that's required.

## Updating

Simply pull the latest version of master and install any changed dependencies:

```
cd xbox-cloud-gaming
git checkout master
git pull
npx yarn
npx yarn build
```
