# 🗄️ Cloud SQL PostgreSQL Setup

**Project**: centering-vine-454613-b3
**Database**: ml_workflow_dev
**Instance Name**: ml-workflow-db

---

## ⚠️ Authentication Required

Your gcloud authentication has expired. Please run:

```bash
gcloud auth login
```

Then continue with the steps below.

---

## 📋 Step-by-Step Setup

### Step 1: Enable Cloud SQL API (1 minute)

```bash
gcloud services enable sqladmin.googleapis.com \
  --project=centering-vine-454613-b3
```

### Step 2: Create Cloud SQL Instance (5-10 minutes)

**Development Configuration** (db-f1-micro - $7/month):

```bash
gcloud sql instances create ml-workflow-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=10GB \
  --storage-auto-increase \
  --backup-start-time=03:00 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=04 \
  --project=centering-vine-454613-b3

# This takes 5-10 minutes - you'll see progress updates
```

**Production Configuration** (db-n1-standard-2 - $100/month):

```bash
gcloud sql instances create ml-workflow-db \
  --database-version=POSTGRES_15 \
  --tier=db-n1-standard-2 \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=50GB \
  --storage-auto-increase \
  --availability-type=REGIONAL \
  --backup-start-time=03:00 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=04 \
  --enable-bin-log \
  --project=centering-vine-454613-b3
```

### Step 3: Set Root Password (1 minute)

```bash
gcloud sql users set-password postgres \
  --instance=ml-workflow-db \
  --password=$(openssl rand -base64 32) \
  --project=centering-vine-454613-b3

# Save the password! You'll need it for DATABASE_URL
# Or set a custom password:
gcloud sql users set-password postgres \
  --instance=ml-workflow-db \
  --password=YOUR_SECURE_PASSWORD \
  --project=centering-vine-454613-b3
```

### Step 4: Create Database (1 minute)

```bash
gcloud sql databases create ml_workflow_dev \
  --instance=ml-workflow-db \
  --project=centering-vine-454613-b3
```

### Step 5: Enable pgvector Extension (2 minutes)

**Option A: Using Cloud SQL Proxy (Recommended)**

```bash
# Download Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.arm64
chmod +x cloud-sql-proxy

# Get connection name
CONNECTION_NAME=$(gcloud sql instances describe ml-workflow-db \
  --project=centering-vine-454613-b3 \
  --format="value(connectionName)")

# Start proxy in background
./cloud-sql-proxy $CONNECTION_NAME &
PROXY_PID=$!

# Wait for proxy to be ready
sleep 5

# Enable pgvector extension
PGPASSWORD=YOUR_PASSWORD psql -h localhost -U postgres -d ml_workflow_dev \
  -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Stop proxy
kill $PROXY_PID
```

**Option B: Whitelist Your IP**

```bash
# Get your public IP
MY_IP=$(curl -s ifconfig.me)

# Whitelist your IP
gcloud sql instances patch ml-workflow-db \
  --authorized-networks=$MY_IP \
  --project=centering-vine-454613-b3

# Get instance IP
INSTANCE_IP=$(gcloud sql instances describe ml-workflow-db \
  --project=centering-vine-454613-b3 \
  --format="value(ipAddresses[0].ipAddress)")

# Enable pgvector extension
PGPASSWORD=YOUR_PASSWORD psql -h $INSTANCE_IP -U postgres -d ml_workflow_dev \
  -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Step 6: Configure Connection (1 minute)

**Get Connection Name**:

```bash
gcloud sql instances describe ml-workflow-db \
  --project=centering-vine-454613-b3 \
  --format="value(connectionName)"

# Output: centering-vine-454613-b3:us-central1:ml-workflow-db
```

**Update .env file**:

```bash
cat >> .env <<EOF

# Cloud SQL Database
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@/ml_workflow_dev?host=/cloudsql/centering-vine-454613-b3:us-central1:ml-workflow-db"
EOF
```

---

## 🔌 Connection Methods

### Method 1: Cloud SQL Proxy (Recommended for Development)

**Pros**: No IP whitelisting, secure tunnel, works from anywhere
**Cons**: Requires proxy process running

```bash
# Start proxy
./cloud-sql-proxy centering-vine-454613-b3:us-central1:ml-workflow-db &

# Use localhost connection
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/ml_workflow_dev"
```

### Method 2: Public IP (Simple for Testing)

**Pros**: Direct connection, no proxy needed
**Cons**: Requires IP whitelisting, less secure

```bash
# Whitelist your IP
gcloud sql instances patch ml-workflow-db \
  --authorized-networks=$(curl -s ifconfig.me) \
  --project=centering-vine-454613-b3

# Get instance IP
INSTANCE_IP=$(gcloud sql instances describe ml-workflow-db \
  --format="value(ipAddresses[0].ipAddress)")

# Use direct connection
DATABASE_URL="postgresql://postgres:PASSWORD@$INSTANCE_IP:5432/ml_workflow_dev"
```

### Method 3: Private IP + VPC (Production)

**Pros**: Most secure, no public internet exposure
**Cons**: Requires VPC setup, only works from GCP resources

```bash
# Enable private IP (during instance creation)
gcloud sql instances create ml-workflow-db \
  --network=projects/centering-vine-454613-b3/global/networks/default \
  --no-assign-ip \
  ...
```

---

## 🧪 Verify Connection

```bash
# Using psql
PGPASSWORD=YOUR_PASSWORD psql -h INSTANCE_IP -U postgres -d ml_workflow_dev -c "SELECT version();"

# Using Prisma
npx prisma db pull

# Test query
PGPASSWORD=YOUR_PASSWORD psql -h INSTANCE_IP -U postgres -d ml_workflow_dev <<EOF
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
EOF
```

---

## 💰 Cost Breakdown

### db-f1-micro (Development)
- **vCPUs**: 1 shared
- **RAM**: 0.6 GB
- **Storage**: 10 GB SSD
- **Cost**: ~$7/month
- **Use Case**: Development, testing, small datasets

### db-n1-standard-1 (Small Production)
- **vCPUs**: 1 dedicated
- **RAM**: 3.75 GB
- **Storage**: 50 GB SSD
- **Cost**: ~$50/month
- **Use Case**: Small production, <100 concurrent connections

### db-n1-standard-2 (Medium Production)
- **vCPUs**: 2 dedicated
- **RAM**: 7.5 GB
- **Storage**: 100 GB SSD
- **Cost**: ~$100/month
- **Use Case**: Medium production, <200 concurrent connections

**Additional Costs**:
- Backups: $0.08/GB/month
- Network egress: $0.12/GB (only if accessing from outside GCP)

---

## 📊 Next Steps After Cloud SQL is Ready

### 1. Install Dependencies (5 minutes)

```bash
cd /Users/nissimmenashe/VERSATIL\ SDLC\ FW

# Install Prisma and API dependencies
npm install
```

### 2. Run Prisma Migrations (5 minutes)

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (creates 11 tables)
npx prisma migrate dev --name init

# Verify tables were created
PGPASSWORD=YOUR_PASSWORD psql -h INSTANCE_IP -U postgres -d ml_workflow_dev \
  -c "\dt"
```

### 3. Seed Database (optional, 2 minutes)

```bash
# Add seed data for development
npx prisma db seed
```

### 4. Start API Server (2 minutes)

```bash
# Compile TypeScript
npx tsc

# Start server
npm start
```

### 5. Verify Deployment (5 minutes)

```bash
# Test API health
curl http://localhost:3000/health

# Open Prisma Studio
npx prisma studio
# Opens http://localhost:5555
```

---

## 🔒 Security Best Practices

### 1. Strong Password
```bash
# Generate secure password
openssl rand -base64 32
```

### 2. Regular Backups
- Automated daily backups enabled by default
- 7-day retention period
- Point-in-time recovery available

### 3. SSL Connections
Cloud SQL enforces SSL by default for public IP connections.

### 4. Private IP (Production)
Use VPC and private IP to prevent public internet access.

### 5. IAM Authentication (Advanced)
```bash
# Create service account for database access
gcloud iam service-accounts create db-access-sa \
  --project=centering-vine-454613-b3

# Grant Cloud SQL Client role
gcloud projects add-iam-policy-binding centering-vine-454613-b3 \
  --member="serviceAccount:db-access-sa@centering-vine-454613-b3.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

---

## 🛠️ Maintenance

### Monitoring
```bash
# Check instance status
gcloud sql instances describe ml-workflow-db \
  --project=centering-vine-454613-b3

# View operations
gcloud sql operations list \
  --instance=ml-workflow-db \
  --project=centering-vine-454613-b3
```

### Scaling
```bash
# Upgrade tier
gcloud sql instances patch ml-workflow-db \
  --tier=db-n1-standard-1 \
  --project=centering-vine-454613-b3

# Increase storage
gcloud sql instances patch ml-workflow-db \
  --storage-size=50GB \
  --project=centering-vine-454613-b3
```

### Backups
```bash
# Create on-demand backup
gcloud sql backups create \
  --instance=ml-workflow-db \
  --project=centering-vine-454613-b3

# List backups
gcloud sql backups list \
  --instance=ml-workflow-db \
  --project=centering-vine-454613-b3

# Restore from backup
gcloud sql backups restore BACKUP_ID \
  --backup-instance=ml-workflow-db \
  --backup-id=BACKUP_ID \
  --project=centering-vine-454613-b3
```

---

## 🚀 Quick Start Commands (Copy-Paste)

```bash
# 1. Authenticate
gcloud auth login

# 2. Enable API
gcloud services enable sqladmin.googleapis.com --project=centering-vine-454613-b3

# 3. Create instance (5-10 minutes)
gcloud sql instances create ml-workflow-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=10GB \
  --storage-auto-increase \
  --backup-start-time=03:00 \
  --project=centering-vine-454613-b3

# 4. Set password
gcloud sql users set-password postgres \
  --instance=ml-workflow-db \
  --password=$(openssl rand -base64 32) \
  --project=centering-vine-454613-b3

# 5. Create database
gcloud sql databases create ml_workflow_dev \
  --instance=ml-workflow-db \
  --project=centering-vine-454613-b3

# 6. Get connection details
gcloud sql instances describe ml-workflow-db \
  --project=centering-vine-454613-b3 \
  --format="value(connectionName)"
```

---

**Total Setup Time**: 15-20 minutes
**Monthly Cost (dev)**: ~$7-10
**Next**: Run Prisma migrations and start API
