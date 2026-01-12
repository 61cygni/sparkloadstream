#!/bin/bash
# Script to copy the local spark build into this project
# Run this whenever you update the spark library locally

echo "Copying spark build files..."
mkdir -p lib
cp ../spark/dist/spark.module.js lib/
cp ../spark/dist/spark.module.js.map lib/ 2>/dev/null || true
# Copy WASM file (loaded relative to spark.module.js)
cp ../spark/rust/spark-internal-rs/pkg/spark_internal_rs_bg.wasm lib/
echo "Done!"
