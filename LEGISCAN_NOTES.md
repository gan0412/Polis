# LegiScan API Best Practices & Guidelines

## Query Limits
- **Public API keys:** 30,000 queries per month (resets on the 1st of each month).
- **Expanded Limits:** Pull API subscriptions for more queries; Push API subscriptions for enterprise replication.
- **Timing:** Follow timing guidelines on Page 7 of the API Manual.
- **Caching:** Local caching of JSON responses is strongly recommended to minimize replay spend.
- **Status Checks:** Always check the `status` code in JSON responses for `OK` or `ERROR` and handle appropriately.

## Datasets
- **Creation:** Weekly on Sunday morning at 5:00 AM Eastern.
- **Payloads:** All individual `getBill`, `getRollCall`, and `getPerson` JSON payloads are combined in a single ZIP file for each legislative session.
- **Efficiency:** ~1000 API queries for 3,500,000+ records (all 2010 - 2026 data).
- **Transport:** ZIP archive files are Base64 encoded in their JSON transport.
- **CRITICAL:** Use `dataset_hash` to prevent duplicative downloads; failure to do so will result in suspended access.

## Texts & Documents
- **Endpoints:** Bill documents are available via `getBillText`, `getAmendment`, and `getSupplement` hooks.
- **Identifiers:** `doc_id`, `amendment_id`, and `supplement_id` are available in `getBill` payloads.
- **Transport:** Document blobs are Base64 encoded in JSON.
- **Caching:** Never download the same document blob more than once.
- **Bulk Data:** One-time snapshot of complete 350GB data for all 2010 - 2026 sessions is available as a paid service.

## Hashes
- **Purpose:** 32-character hash values are available to detect data changes and optimize query spend.
- **Usage:** 
  - `change_hash` + `bill_id` for bill data (`getBill`, `getMasterList`, `getSearch`, `getMasterListRaw`, `getSearchRaw`).
  - `dataset_hash` + `session_id` for dataset archives (`getDatasetList`, `getDataset`).
- **Implementation:** Store and compare hashes. If the hash is the same, use your local cache. Do not query! 
- **Rule:** "Use the hashes. No. Really. Use them."

## Work Loop
- **Standard Loop:** Driven by checking `getMasterListRaw` or `getSearchRaw` periodically (daily/weekly).
- **Delta Checks:** Use `change_hash` in the results to determine when to spend queries on updating individual data.
- **Open Source:** A turnkey LegiScan API Client is available to process Pull, Push, and Bulk data into a defined SQL schema.

## Housekeeping
- **Scraping:** Scraping the legiscan.com front-end site is prohibited (results in suspension).
- **Keys:** Creating multiple Public API service keys is prohibited (results in suspension).
- **Attribution:** All data is CC BY 4.0. You must give LegiScan attribution on your platform.
