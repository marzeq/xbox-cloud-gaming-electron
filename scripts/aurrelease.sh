#!/bin/sh
VERSION=$(awk -F'"' '/"version": ".+"/{ print $4; exit; }' package.json)
sed "s/pkgver=\".*\"/pkgver=\"$VERSION\"/" -i arch/PKGBUILD

# md5sum generation
SUMOUTPUT=$(md5sum dist/xbox-cloud-gaming-electron_$VERSION.pacman)
SUM=$(echo $SUMOUTPUT | awk '{print $1}')

sed "s/md5sums=(\".*\")/md5sums=(\"$SUM\")/" -i arch/PKGBUILD

cd arch

git clone ssh://aur@aur.archlinux.org/xbox-cloud-gaming.git

cp PKGBUILD xbox-cloud-gaming/PKGBUILD

cd xbox-cloud-gaming

makepkg --printsrcinfo > .SRCINFO
git add PKGBUILD .SRCINFO
git commit -m "v$VERSION"

git push

cd ../..

rm -rf arch/xbox-cloud-gaming

git add arch/PKGBUILD

git commit -m "PKGBUILD updated to v$VERSION"

git push