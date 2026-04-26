Per-user monthly cost (DB metadata + profile image) — formulas & sample

Variables:
- `M` = Mongo price ($/GB/month). Sample used earlier: `M = $0.25`.
- `C` = Cloudinary storage price ($/GB/month). Sample: `C = $0.10`.
- `DB_kB` = per-user DB metadata size in KB (from main estimates).
- `Photo_MB` = average profile photo size in MB (sample = `0.2` MB).

Formulas:
- DB size in GB = `DB_kB / 1024 / 1024`.
- DB cost/month = `DB_size_GB * M`.
- Photo size in GB = `Photo_MB / 1024`.
- Photo storage cost/month = `Photo_size_GB * C`.
- Total per-user/month = `DB cost + Photo cost`.

Sample numbers used below: `M = $0.25`, `C = $0.10`, `Photo_MB = 0.2`.

Per-user results (rounded):
- Student — DB: `5.6 KB` → DB cost ≈ `$0.0000013` / month; Photo cost ≈ `$0.00001953`; Total ≈ `$0.00002087` (~$0.000021).
  - Per 1,000 students ≈ `$0.0209` / month.
- Teacher — DB: `8 KB` → DB cost ≈ `$0.0000019` / month; Photo cost ≈ `$0.00001953`; Total ≈ `$0.00002144` (~$0.000021).
  - Per 100 teachers ≈ `$0.00214` / month.
- Parent — DB: `5 KB` → DB cost ≈ `$0.0000012` / month; Photo cost ≈ `$0.00001953`; Total ≈ `$0.00002072` (~$0.000021).
  - Per 500 parents ≈ `$0.01036` / month.
- Staff — DB: `6 KB` → DB cost ≈ `$0.0000014` / month; Photo cost ≈ `$0.00001953`; Total ≈ `$0.00002096` (~$0.000021).
- Super Admin / Branch Admin — DB: `6 KB` → same as `Staff` ≈ `$0.00002096` / month.

Notes:
- These numbers are intentionally tiny because raw storage costs at these sizes are negligible. The real monthly bill is dominated by provider base tiers (managed DB instance cost, backup retention) and read/write IOPS, not raw KB storage.
- If you want a per-user monthly cost that includes estimated bandwidth (views/downloads) or per-user media attachments, provide average attachments per user and average monthly download volume and I'll extend the table.

How to use:
- Replace `M`/`C` with your provider prices to get exact per-user costs.
- Multiply per-user total by your counts (students, teachers, etc.) to get aggregate monthly cost.

If you'd like, I can now:
- Insert this section into `docs/storage-cost-estimates.md` inline, or
- Recompute all numbers using your real counts and provider prices and produce a CSV/Excel month-by-month projection.
