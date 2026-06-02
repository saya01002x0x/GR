# Load Testing with k6

This script simulates 100 virtual users (VUs) simultaneously viewing and liking an artwork to test:
1. View increment scaling via Redis `INCR`
2. Like buffering via BullMQ

## Install k6
- **Windows**: `winget install k6` or `choco install k6`
- **macOS**: `brew install k6`
- **Linux**: `sudo apt-get install k6`

## How to run

To test **view counts only** (Anonymous users):
```bash
# Set ARTWORK_ID to a real UUID from your Prisma database
k6 run -e ARTWORK_ID="your-artwork-id" load-test.js
```

To test **likes/views concurrently** (Authenticated user):
```bash
# Get a test JWT from Clerk Dashboard > Testing
k6 run -e ARTWORK_ID="your-artwork-id" -e AUTH_TOKEN="your-clerk-jwt" load-test.js
```

## Interpreting Results
- Monitor the **Grafana dashboard** (`localhost:3002`) while running this.
- Check the Bull Board (`localhost:5145/admin/queues`) to see the `stats-queue` process the burst of jobs.
- The `http_reqs_failed` metric in the k6 console should remain `0.00%`.
