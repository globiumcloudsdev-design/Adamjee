Storage & Cost Estimates — ease-academy

Purpose
- Provide quick, actionable estimates for MongoDB (document storage) and Cloudinary (media storage + bandwidth) based on the current data models and expected activity.
- Include formulas so you can plug provider prices for an accurate bill.

Assumptions (change as needed)
- Average ObjectId size: 12 bytes (stored as BSON 12 bytes).
- Field overhead, BSON doc overhead, indexes, padding, etc. → multiply raw payload by 1.5x to 2x depending on fragmentation. We'll use 1.6x multiplier for safety.
- String average bytes = character count (UTF-8). We'll approximate values.
- Prices: leave as variables; show example with sample prices (replace with your provider).

Sample provider price (examples — replace with your contract):
- Mongo storage price: $0.25 / GB / month (SAMPLE)
- Cloudinary storage price: $0.10 / GB / month (SAMPLE)
- Cloudinary bandwidth price: $0.09 / GB (SAMPLE)

Key model per-document size estimates (approx, before multiplier)
1) `User` (student/teacher/parent/staff): ~3.5 KB
   - IDs, names, email, phone, profilePhoto metadata (url/publicId strings), studentProfile small fields
   - After multiplier (1.6): ~5.6 KB per user

2) `Attendance` (one document per class/day with `records` array): ~1 KB base + ~120 bytes per student entry
   - Base (date, branchId, classId, metadata): ~1 KB
   - Each student record entry (studentId + status + remarks small): ~120 bytes
   - Example: class of 40 => 1 KB + 40*0.12 KB = 5.8 KB → *1.6 = ~9.3 KB

3) `Assignment`: ~1.2 KB (metadata) + attachments size stored in Cloudinary (see Cloudinary section)
   - After multiplier: ~1.9 KB

4) `Submission`: ~0.8 KB + attachments stored in Cloudinary
   - After multiplier: ~1.3 KB

5) `Branch`: ~1 KB + bankAccounts array (each ~200 bytes) → typical branch (2 accounts) ~1.4 KB → *1.6 = ~2.2 KB

6) `Timetable` (per class): depends on periods; average ~4 KB → *1.6 = ~6.4 KB

7) Other small docs (Grade, Subject, Event): typically 0.5–1 KB each.

Activity assumptions (example workload)
- School size for sample: 1,000 students, 100 teachers, 10 branches, 50 staff, 500 parents.
- Attendance marking: daily for each class. Suppose 25 classes across day (or 40 students/class). We'll estimate by student attendance entries as part of class/day document.
- Assignments/quizzes/uploads: 50 new assignments per month, 400 submissions per month.
- Profile uploads (Cloudinary): 50 new profile images per month (students/teachers/parents), average size 200 KB each.
- Other media uploads (assignments attachments, resources): 200 uploads/month average 2 MB each.

Storage growth calculations (examples)
A) Users (1,610 total users sample: students+teachers+staff+parents):
   - Per user ≈ 5.6 KB → 1,610 * 5.6 KB ≈ 9,016 KB ≈ 8.8 MB
   - Annual (no churn) ≈ 8.8 MB (users are small)

B) Attendance documents (class-level docs with records array):
   - If one attendance doc per class per school day: assume 25 classes * 200 school days ≈ 5,000 docs/year
   - Per doc ~9.3 KB → 5,000 * 9.3 KB ≈ 46,500 KB ≈ 45.4 MB/year
   - Monthly ≈ 3.8 MB

C) Assignments + Submissions (DB metadata only):
   - 50 assignments/month * 1.9 KB ≈ 95 KB/month
   - 400 submissions/month * 1.3 KB ≈ 520 KB/month
   - Total ≈ 615 KB/month (negligible)

D) Timetables, Events, Others: assume 10–20 MB total for entire app data (small)

Cloudinary (media) estimates
- Profile images: 50 * 0.2 MB = 10 MB / month
- Assignment attachments (docs, pdfs): 200 * 2 MB = 400 MB / month
- Total storage add per month ≈ 410 MB
- Bandwidth: assume most resources are downloaded/viewed. Example monthly bandwidth = 2x storage uploaded = ~820 MB transfer (adjust for your usage)

Example cost calculation (plug-in)
Let:
  M = Mongo price per GB/month
  C = Cloudinary storage $/GB/month
  B = Cloudinary bandwidth $/GB

Convert totals to GB: 1 GB = 1024 MB.
Sample totals (rounded):
  - MongoDB data stored ~ 0.06 GB (users + attendance + meta ≈ ~60 MB) → 0.06 GB
  - Cloudinary storage growth/month ≈ 0.4 GB
  - Cloudinary bandwidth/month ≈ 0.8 GB

Monthly cost (sample prices M=$0.25, C=$0.10, B=$0.09):
  - Mongo: 0.06 GB * $0.25 = $0.015 / month
  - Cloudinary storage: 0.4 GB * $0.10 = $0.04 / month
  - Cloudinary bandwidth: 0.8 GB * $0.09 = $0.072 / month
  - Total monthly ~= $0.127 (sample)

Yearly (sample): ~ $1.52

Notes & guidance
- These numbers are purposely conservative and show that for small-medium schools storage costs are tiny; the real costs come from number of reads/ops and higher-tier managed DB cluster overhead, backups, I/O, and provider minimums (Atlas cluster pricing has base VM cost far above raw storage price). Expect provider minimum monthly charges (e.g., Atlas shared/paid tiers) — storage price alone is NOT the final bill.
- For production: estimate reads/writes (OPs) and choose a provider tier. Indexes and replication increase storage by ~1.5x (replica set copies), backups add more.
- Cloudinary: costs grow with media size and bandwidth; use long-term CDN caching and optimized images to reduce bandwidth.

How you can refine these estimates quickly
1. Tell me real counts: number of students, teachers, branches, expected uploads/month, average attachment sizes.
2. Tell me your provider prices (MongoDB Atlas plan or per-GB storage and IOPS) and Cloudinary plan (or use sample numbers above).

Summary (short)
- DB metadata storage for a 1k-student school is small (tens of MBs).
- Cloudinary media storage is likely the dominant growth (hundreds of MB/month). With sample prices monthly cost remains small (< $1) but real provider minimums (VM/cluster/base plan) will dominate final monthly bill.

Would you like me to:
- Recompute with your real counts and preferred provider prices? (recommended)
- Produce a CSV or spreadsheet of the month-by-month projection for 3 years? I can add that file to `docs/`.

-- End of document

Detailed Projection & Plan (weekly / monthly / yearly)

1) Inputs / Example Scenario (you can change these to your real numbers):
   - Students: 1,000
   - Teachers: 100
   - Branches: 10
   - Staff: 50
   - Parents: 500
   - Average class size: 40
   - Classes per day (attendance docs): 25
   - School days per year: 200
   - Assignments per month: 50
   - Submissions per month: 400
   - Profile uploads/month: 50 (avg 0.2 MB each)
   - Other uploads/month: 200 (avg 2 MB each)

2) Per-item sizes used (rounded, after 1.6x multiplier):
   - User (student/teacher/parent/staff): student 5.6 KB, teacher 8 KB, parent 5 KB, staff 6 KB, super_admin/branch_admin 6 KB
   - Attendance (class/day doc with records array): 9.3 KB
   - Assignment (metadata): 1.9 KB
   - Submission (metadata): 1.3 KB
   - Timetable (per class): 6.4 KB

3) Weekly / Monthly / Yearly calculations (example)

   A) Users (static storage)
      - Total users = 1,000 students + 100 teachers + 50 staff + 500 parents + 2 admins = 1,652
      - Storage = (1000 * 5.6 KB) + (100 * 8 KB) + (50 * 6 KB) + (500 * 5 KB) + (2 * 6 KB)
      - = 5,600 KB + 800 KB + 300 KB + 2,500 KB + 12 KB = 9,212 KB ≈ 9.0 MB (stored once)

   B) Attendance (grows with school days)
      - One attendance doc per class per day: 25 classes * 5 days = 125 docs/week
      - Weekly attendance storage = 125 * 9.3 KB ≈ 1,162.5 KB (~1.14 MB/week)
      - Monthly (4.33 weeks) ≈ 4.95 MB/month
      - Yearly (200 school days = 8 months of ~25 days) ≈ 5,000 docs/year → 5,000 * 9.3 KB = 46.5 MB/year

   C) Assignments & Submissions
      - Assignments/month DB = 50 * 1.9 KB = 95 KB
      - Submissions/month DB = 400 * 1.3 KB = 520 KB
      - Monthly total ≈ 615 KB (~0.6 MB)

   D) Timetables, Events, Misc
      - Small, estimate 10 MB total across system

   E) Cloudinary (media) monthly
      - Profile images: 50 * 0.2 MB = 10 MB
      - Assignment attachments: 200 * 2 MB = 400 MB
      - Monthly media uploaded ≈ 410 MB → ~0.4 GB
      - Monthly bandwidth (views/downloads) estimate = 2x uploads = 0.8 GB

4) Convert to GB and cost using sample prices
   - Convert: 1 GB = 1024 MB
   - Mongo data (approx total stored): Users (9 MB) + attendance yearly incr (46.5 MB) + other metadata (10 MB) ≈ 65.5 MB ≈ 0.064 GB
   - Cloudinary storage growth/month ≈ 0.4 GB
   - Cloudinary bandwidth/month ≈ 0.8 GB

   Sample prices (replace with your plan):
     Mongo storage: M = $0.25 / GB / month
     Cloudinary storage: C = $0.10 / GB / month
     Cloudinary bandwidth: B = $0.09 / GB

   Costs (sample):
     - Mongo monthly = 0.064 GB * M = 0.064 * $0.25 = $0.016
     - Cloudinary storage monthly = 0.4 GB * C = $0.04
     - Cloudinary bandwidth monthly = 0.8 GB * B = $0.072
     - Total monthly (sample) ≈ $0.128
     - Yearly ≈ $1.54

5) Breakdown per period (weekly / monthly / yearly) — sample
   - Weekly storage growth (approx):
       Attendance growth ≈ 1.14 MB
       Media uploads ≈ 410 MB / 4.33 ≈ 95 MB/week
       DB metadata growth ≈ negligible weekly for users
       Total weekly new ≈ 96.1 MB → 0.094 GB
       Weekly cost (cloudinary storage tiered ignored): ~0.094 * C ≈ $0.0094 storage-equivalent (but Cloudinary bills monthly)

   - Monthly growth (approx):
       DB small: ~5 MB/month (attendance + assignments)
       Media uploads: ~410 MB/month → 0.4 GB
       Monthly cost (sample): ~ $0.128 (see above)

   - Yearly growth (approx):
       DB: ~65 MB/year
       Media: 0.4 GB * 12 = 4.8 GB/year uploaded
       Bandwidth: 0.8 GB * 12 = 9.6 GB/year
       Yearly cost (sample): Mongo: 0.064*12*$0.25 ≈ $0.19; Cloudinary storage: 4.8*$0.10=$0.48; bandwidth 9.6*$0.09=$0.864 → total ≈ $1.53

6) Operational costs to consider (real-world):
   - Managed DB cluster base cost (MongoDB Atlas tier) — typically $9+/month for smallest paid tier or higher depending on memory/IO. This will dominate costs for production.
   - Backups & snapshot storage
   - Read/write IOPS limits and scaling
   - CDN & additional bandwidth charges

7) Actionable Plan (recommended)
   - Phase 1 (Immediate): Use above sample projection. Enable CDN caching for media, set image optimization.
   - Phase 2 (1–3 months): Collect real metrics: uploads/month, average file sizes, read rates (API hits per day). Replace assumptions with real numbers and re-run projections.
   - Phase 3 (6–12 months): Set retention policy for old media (archive to cheaper storage), set TTL for outdated attendance if you prefer aggregations instead of raw docs.

8) Deliverables I can produce for you now (pick one):
   - Recompute with your real counts (students/teachers/branches/staff/parents) and your provider prices — I'll update numbers and deliver a ready-to-present PDF/MD.
   - Produce a 3-year month-by-month CSV/Excel projection using your inputs.
   - Add a small script to compute costs automatically from a config file.

Notes
 - These projections intentionally isolate raw storage and bandwidth. Real bills will be higher due to base service tiers, backups, monitoring, and operations.
 - If you give me your exact counts and your Cloudinary/Mongo plan prices, I'll produce a precise cost table and CSV.

---

End of extended estimates.


Roman (Urdu in Roman) — Har user type ki short definition aur estimate

- Super Admin: School system ka top-level admin. Iska record normal user se bara nahin hota—profile, email, permissions waghera. Estimate per `super_admin` document: ~6 KB (1.6x multiplier included).

- Branch Admin: Har branch ka admin. Branch-specific settings, bank account links, branch association hoti hai. Estimate per `branch_admin` user: ~6 KB (profile + adminProfile metadata).

- Teacher: Teacher ka record mein teacherProfile (subjects, classes, salaryDetails, documents) hota hai. Agar CVs aur documents store hotay hain to metadata bari ho sakti hai; per-teacher DB metadata approx ~8 KB. Media files (CV, photo) Cloudinary par alag store honge.

- Student: Student mein studentProfile (registrationNumber, classId, section, rollNumber, parents short info) aur profilePhoto metadata hota hai. Per-student DB metadata approx ~5.5 KB.

- Parent: Parent ka record children array rakhta hai (child id refs + cached info). Per-parent DB metadata approx ~5 KB.

- Staff: Staff similar to teacher but usually kam subject data; per-staff DB metadata approx ~6 KB.

Notes (Roman):
- Ye sizes sirf DB metadata (BSON) kay liye hain — attachments, photos, videos Cloudinary par store hongay aur unka size alag se calculate karo.
- Agar aap chaho to main in per-user estimates ko aap kay actual user counts kay sath multiply kar kay month/quarter/year projections dal dun.

