## Google Cloud ETL Architecture: IronSource to BigQuery

This automated pipeline orchestrates data movement from the IronSource API into a BigQuery data warehouse, utilizing a "Medallion" architecture (Bronze/Silver/Gold) for data integrity.

### 1. Extraction & Raw Storage (Bronze Layer)
The process begins with a serverless execution environment (such as **Cloud Functions** or **Cloud Run**) triggered by **Cloud Scheduler**. 
* **Ingestion:** The service authenticates with the IronSource API and fetches data in its native format (JSON/CSV).
* **Persistence:** The raw, immutable response is timestamped and stored in a **"Bronze" Google Cloud Storage (GCS) bucket**. This ensures a "Source of Truth" is available for auditing or reprocessing if logic changes.

### 2. Transformation & Cleaning (Silver Layer)
A transformation script processes the raw files to ensure schema consistency and data quality.
* **Processing:** Data is cleaned (handling nulls, formatting dates, renaming columns).
* **Staging:** These cleaned files are saved into a **"Silver" GCS bucket**. 

### 3. Consolidation (Gold Layer)
To optimize the BigQuery load process and reduce API overhead, the individual transformed files are merged.
* **Blob Composition:** Using the GCS Compose feature, the transformed objects are joined into a single optimized blob (e.g., a large Parquet or Newline-delimited JSON file).
* **Final Staging:** This consolidated file is stored in a **"Gold" GCS bucket** or a specific "Loading" prefix.



### 4. BigQuery Loading Strategy
The final step uses a **BigQuery Load Job**, which is more cost-effective than streaming inserts for batch data.

| Table Type | Logic | Implementation |
| :--- | :--- | :--- |
| **Fact Tables** | **Dynamic Partition Overwrite** | The pipeline identifies the specific date range in the incoming data and overwrites only those corresponding days/partitions in BigQuery using `write_disposition: WRITE_TRUNCATE` with a partition filter. |
| **Dimension Tables** | **Full Overwrite** | Since dimension tables (like app metadata or country codes) are typically smaller, the entire table is replaced with the latest snapshot to ensure data freshness. |

---

### Key Benefits
* **Idempotency:** The "Overwrite by Day" logic for Fact tables allows you to re-run the pipeline for any specific date without duplicating data.
* **Cost Efficiency:** By joining files into a single blob before importing, you minimize the number of BigQuery jobs and GCS operations.
* **Data Lineage:** Maintaining separate buckets for "Original" and "Transformed" values allows for easy troubleshooting.
