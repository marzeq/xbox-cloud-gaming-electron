#!/bin/bash
VERSION=$(awk -F'"' '/"version": ".+"/{ print $4; exit; }' package.json)
gh release create $VERSION dist/xbox-cloud-gaming-electron_$VERSION.* --generate-notes