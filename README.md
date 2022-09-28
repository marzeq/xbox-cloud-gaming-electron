# About

**This is a fork of the** [**geforcenow-electron app**](https://github.com/hmlendea/geforcenow-electron) written in Electron, that wraps around the Xbox Cloud Gaming web browser implementation.

## Installation

[![Get it from the AUR](https://raw.githubusercontent.com/hmlendea/readme-assets/master/badges/stores/aur.png)](https://aur.archlinux.org/packages/xbox-cloud-gaming/)

Currently the project is available on these repositories: **AUR**

## Manual Installation

-   Go to the [latest release](https://github.com/marzeq/xbox-cloud-gaming-electron/releases/latest).
-   Download the specific file that best fits your disto.
-   Install it

# Usage

If you've installed it through your package manager, then it should already contain a launcher for it. Otherwise, run the `xbox-cloud-gaming-electron` binary.

To toggle full-screen mode, use the `F11` keyboard shortcut.

## FAQ

### Why is my game lagging/my quality is bad?

You might not have VA-API support enabled on your system. To check if it's the case, run the app from the terminal and see if you get any errors related to VA-API.

If you do, please refer to your's distro's documentation on how to install and enable it.

You will also need `libva-utils` installed so the program can verify you have VA-API enabled. It contains the `vainfo` command, which will tell you if you have VA-API support enabled. It might be under a different name depending on your distro.

### Why do I keep getting logged out?

This is an issue on Microsoft's side. If you click on the "Sign in" button, it will log you in again without a need to enter your credentials.

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
