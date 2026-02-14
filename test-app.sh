#!/bin/bash

# Simple test script to verify the file transfer application

echo "Testing File Transfer Application"
echo "=================================="

# Check if backend is running
echo -n "Checking backend health... "
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✓ Backend is running"
else
    echo "✗ Backend is not running. Please start it first."
    exit 1
fi

# Create test files
echo "Creating test files..."
mkdir -p /tmp/file-transfer-test
echo "Hello from test file 1" > /tmp/file-transfer-test/test1.txt
echo "This is test file 2" > /tmp/file-transfer-test/test2.txt
echo "Another test file" > /tmp/file-transfer-test/test3.txt

# Upload files
echo -n "Uploading files... "
RESPONSE=$(curl -s -X POST \
  -F "files=@/tmp/file-transfer-test/test1.txt" \
  -F "files=@/tmp/file-transfer-test/test2.txt" \
  -F "files=@/tmp/file-transfer-test/test3.txt" \
  http://localhost:3001/api/upload)

CODE=$(echo $RESPONSE | grep -o '"code":"[0-9]*"' | cut -d'"' -f4)

if [ -n "$CODE" ]; then
    echo "✓ Upload successful!"
    echo "Transfer code: $CODE"
    
    # Get transfer info
    echo -n "Retrieving transfer info... "
    TRANSFER_INFO=$(curl -s http://localhost:3001/api/transfer/$CODE)
    FILE_COUNT=$(echo $TRANSFER_INFO | grep -o '"name":"[^"]*"' | wc -l)
    
    if [ "$FILE_COUNT" -eq 3 ]; then
        echo "✓ Found $FILE_COUNT files"
        
        # Download files
        echo "Testing downloads..."
        FILE_ID=$(echo $TRANSFER_INFO | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        
        curl -s -o /tmp/downloaded-file.txt "http://localhost:3001/api/download/$CODE/$FILE_ID"
        if [ -f /tmp/downloaded-file.txt ]; then
            echo "✓ Single file download works"
        else
            echo "✗ Single file download failed"
        fi
        
        curl -s -o /tmp/transfer-all.zip "http://localhost:3001/api/download-all/$CODE"
        if [ -f /tmp/transfer-all.zip ]; then
            echo "✓ ZIP download works"
        else
            echo "✗ ZIP download failed"
        fi
    else
        echo "✗ Expected 3 files, found $FILE_COUNT"
    fi
else
    echo "✗ Upload failed"
    echo "Response: $RESPONSE"
    exit 1
fi

echo ""
echo "All tests passed! ✓"
echo "Files will be automatically deleted in 10 minutes."

# Cleanup
rm -rf /tmp/file-transfer-test /tmp/downloaded-file.txt /tmp/transfer-all.zip
