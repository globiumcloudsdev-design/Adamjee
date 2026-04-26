# Storage & Cost Estimates for Ease-Academy

## Cheap Database Alternatives

### 1. **MongoDB Atlas (Current - Most Cost-Effective for Your Scale)**
- **Free Tier:** 512 MB storage (sufficient for initial setup)
- **Shared Clusters:** $9/month (M0 - 512 MB, good for development)
- **Dedicated Clusters:** $60/month (M10 - 10GB, recommended for production)
- **Why cheap:** Pay only for what you use, scales with your data
- **Current usage:** 1 MB (well within free tier limits)

### 2. **Supabase (PostgreSQL)**
- **Free Tier:** 500 MB database, 50 MB file storage
- **Pro Plan:** $25/month (500 MB DB, 1 GB files, 2 GB bandwidth)
- **Team Plan:** $99/month (8 GB DB, 10 GB files, 20 GB bandwidth)
- **Why cheap:** Generous free tier, all-in-one solution (DB + Auth + Storage)


### 4. **Firebase Firestore**
- **Free Tier:** 1 GB storage, 50K reads/day, 20K writes/day
- **Blaze Plan:** Pay-as-you-go ($0.06/100K reads, $0.18/100K writes)
- **Why cheap:** Generous free tier for small applications

### 5. **AWS RDS Free Tier**
- **Free for 12 months:** t2.micro instance (1 GB RAM, 20 GB storage)
- **After free tier:** ~$15-20/month for basic setup
- **Why cheap:** If you already use AWS services


## Recommendation for Your Project

### **Best Cheap Option: MongoDB Atlas M10 ($60/month)**
- **Why:** You're already using MongoDB, minimal migration needed
- **Storage:** 10 GB (enough for 5+ years growth)
- **Performance:** Dedicated cluster, better than shared tiers
- **Features:** Automated backups, monitoring, scaling

### **Alternative: Supabase Pro ($25/month)**
- **Why:** All-in-one solution (DB + Auth + Real-time + Storage)
- **Storage:** 500 MB DB + 1 GB files (upgradeable)
- **Benefits:** Built-in authentication, real-time features

## Migration Considerations

### From MongoDB to PostgreSQL (if switching):
1. **Data Export:** Use `mongoexport` to JSON
2. **Schema Design:** Convert flexible documents to relational tables
3. **Application Changes:** Update queries from MongoDB syntax to SQL
4. **Testing:** Thorough testing of all CRUD operations

### Cost Comparison (Monthly):
- **MongoDB Atlas M10:** $60
- **Supabase Pro:** $25

## School Configuration
- **Students:** 500
- **Teachers:** 30
- **Admin Staff:** 10
- **Parents:** ~500 (estimated, 1 parent per student)
- **Total Users:** ~1,040
- **Branches:** 1 (assumed)
- **Classes per day:** ~15 (assuming 500 students / 33 students per class ≈ 15 classes)
- **School days per year:** 200
- **Monthly Activities:**
  - Exams: 1 per month
  - Assignments: 2-3 per month
  - Quizzes: 2-3 per month
  - Books/Library items: Weekly additions

## Database Storage Estimates

### MongoDB (Current Database)

#### Per-Document Size Estimates (after 1.6x BSON multiplier)
- **User (Student):** 5.6 KB
- **User (Teacher):** 8 KB
- **User (Parent):** 5 KB
- **User (Admin Staff):** 6 KB
- **Attendance (per class/day):** 9.3 KB (base 1KB + 33 students × 120 bytes)
- **Assignment:** 1.9 KB (metadata only)
- **Submission:** 1.3 KB (metadata only)
- **Exam:** 2.5 KB (metadata + questions)
- **Fee Voucher:** 3 KB
- **Library Book:** 2 KB

#### Monthly Storage Growth
**Users (static):** 1,040 × 5.8 KB avg = ~6 MB (one-time)

**Attendance:** 15 classes × 20 school days × 9.3 KB = ~2,790 KB/month ≈ 2.7 MB/month

**Assignments & Quizzes:** (2-3 assignments + 2-3 quizzes) × 1.9 KB = ~9.5 KB/month (negligible)

**Submissions:** 500 students × 5 submissions × 1.3 KB = ~3,250 KB/month ≈ 3.2 MB/month

**Exams:** 1 exam × 500 submissions × 1.3 KB = ~650 KB/month

**Fee Records:** 500 students × 12 months × 3 KB = ~18 MB/year ≈ 1.5 MB/month

**Library:** 4 books/week × 2 KB = ~8 KB/week ≈ 0.03 MB/month

**Total Monthly DB Growth:** ~7.5 MB/month
**Annual DB Storage:** ~90 MB (after 1 year)

### Supabase (PostgreSQL Alternative)

#### Storage Estimates
- **Base overhead:** Higher than MongoDB due to relational structure
- **User tables:** Similar sizes to MongoDB documents
- **Estimated monthly growth:** ~8-10 MB/month (slightly higher due to indexing)
- **Annual storage:** ~100-120 MB

**Advantages over MongoDB:**
- Better for complex queries and relationships
- Built-in authentication
- Real-time subscriptions

**Disadvantages:**
- Higher storage costs for document-heavy data
- Less flexible schema for varying student/teacher profiles

## Cloudinary (Media Storage)

### Monthly Upload Estimates
- **Profile images:** 50 new (students/teachers/parents) × 0.2 MB = 10 MB
- **Assignment attachments:** 3 assignments × 500 students × 2 MB avg = 3,000 MB (3 GB)
- **Exam papers/results:** 1 exam × 500 × 1 MB = 500 MB
- **Library books (digital):** 4 books × 50 MB avg = 200 MB
- **Other media:** Certificates, announcements, etc. = 100 MB

**Total Monthly Upload:** ~3.81 GB
**Storage Growth:** ~3.81 GB/month
**Bandwidth Usage:** ~7.62 GB/month (2x uploads for views/downloads)

### Cost Estimates (Sample Prices)
- **Cloudinary Storage:** $0.10/GB/month × 3.81 GB = $0.38/month
- **Cloudinary Bandwidth:** $0.09/GB × 7.62 GB = $0.69/month
- **Total Cloudinary:** $1.07/month

## Total Monthly Costs & Per-User Calculations

### MongoDB Atlas M10 ($60/month) + Cloudinary ($1.07/month)
- **Total Monthly Cost:** $61.07
- **Database Hosting:** $60
- **Media Storage (Cloudinary):** $1.07
- **Breakdown:** 90% database, 2% media storage

### Supabase Pro ($25/month) + Cloudinary ($1.07/month)
- **Total Monthly Cost:** $26.07
- **Database Hosting:** $25
- **Media Storage (Cloudinary):** $1.07
- **Breakdown:** 96% database, 4% media storage

### Per-User Monthly Storage (Database Only)
- **Per Student:** 7.5 MB ÷ 500 students = **0.015 MB/month** (~15 KB/month)
- **Per Teacher:** 7.5 MB ÷ 30 teachers = **0.25 MB/month** (~250 KB/month)
- **Per Admin Staff:** 7.5 MB ÷ 10 staff = **0.75 MB/month** (~750 KB/month)
- **Per Parent:** Included in total user calculation (~0.007 MB/month)

### Per-User Monthly Storage (Including Media)
- **Per Student:** 3.81 GB ÷ 500 students = **7.62 MB/month** (assignments + profile)
- **Per Teacher:** 3.81 GB ÷ 30 teachers = **127 MB/month** (materials + profile)
- **Per Admin Staff:** 3.81 GB ÷ 10 staff = **381 MB/month** (documents + profile)


### Projected Growth (1 Year)
- **MongoDB:** ~90 MB data + indexes
- **Cloudinary:** ~45.7 GB storage + ~91.4 GB bandwidth
- **Total Monthly Cost:** ~$1.10 (Cloudinary) + DB hosting fees

### Cost Breakdown
- **MongoDB Atlas (M10 cluster):** $60-100/month (includes base hosting)
- **Cloudinary:** $1.10/month (storage + bandwidth)
- **Total Monthly:** $61-101 (excluding bandwidth spikes)

## Recommendations

1. **Database Choice:** Stick with MongoDB for flexibility with varying user profiles and document storage.

2. **Optimization Strategies:**
   - Implement data archiving for old attendance records (>2 years)
   - Use Cloudinary transformations to reduce image sizes
   - Compress PDF assignments before upload

3. **Monitoring:**
   - Set up alerts for storage usage >80% capacity
   - Regular cleanup of temporary files

4. **Scaling Considerations:**
   - For 500 students, current estimates are conservative
   - Monitor actual usage for 3-6 months to refine projections

## Monthly Activity Impact
- **Assignments:** 2-3/month = ~3 GB media storage
- **Exams:** 1/month = ~0.5 GB media storage
- **Attendance:** Daily = ~2.7 MB DB growth
- **Library:** Weekly books = minimal impact

*Note: These are estimates based on typical usage patterns. Actual storage will vary based on file sizes, retention policies, and user activity.*
