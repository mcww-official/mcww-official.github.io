#!/bin/sh
# assets/ の元画像（PNG）を、表示用の軽い webp にして img/ に置く。
# 使い方：サイトのフォルダ（index.html のある所）で  sh assets/make-images.sh
cd "$(dirname "$0")/.." || exit 1
for n in seiryu suzaku byakko genbu; do
  ffmpeg -y -loglevel error -i "assets/$n.png" -vf "scale=480:-2:flags=lanczos" -c:v libwebp -quality 82 "img/$n.webp" && echo "img/$n.webp"
done
ffmpeg -y -loglevel error -i assets/logo.png -vf "scale='min(640,iw)':-1:flags=lanczos" -c:v libwebp -quality 88 img/logo.webp && echo img/logo.webp
