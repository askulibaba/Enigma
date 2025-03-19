#!/usr/bin/env bash

set -e

echo "Копирование файлов из public в dist..."
cp -R ./public/* ${1:-"dist"}

echo "Копирование WASM файлов..."
if [ -f ./src/lib/rlottie/rlottie-wasm.wasm ]; then
  cp ./src/lib/rlottie/rlottie-wasm.wasm ${1:-"dist"}
  echo "rlottie-wasm.wasm скопирован"
else
  echo "ВНИМАНИЕ: rlottie-wasm.wasm не найден!"
fi

if [ -f ./node_modules/opus-recorder/dist/decoderWorker.min.wasm ]; then
  cp ./node_modules/opus-recorder/dist/decoderWorker.min.wasm ${1:-"dist"}
  echo "decoderWorker.min.wasm скопирован"
else
  echo "ВНИМАНИЕ: decoderWorker.min.wasm не найден!"
fi

echo "Копирование emoji-data..."
if [ -d ./node_modules/emoji-data-ios/img-apple-64 ]; then
  cp -R ./node_modules/emoji-data-ios/img-apple-64 ${1:-"dist"}
  echo "img-apple-64 скопирован"
else
  echo "ВНИМАНИЕ: директория emoji-data-ios/img-apple-64 не найдена!"
fi

if [ -d ./node_modules/emoji-data-ios/img-apple-160 ]; then
  cp -R ./node_modules/emoji-data-ios/img-apple-160 ${1:-"dist"}
  echo "img-apple-160 скопирован"
else
  echo "ВНИМАНИЕ: директория emoji-data-ios/img-apple-160 не найдена!"
fi

echo "Копирование завершено"
