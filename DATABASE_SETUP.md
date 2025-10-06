# Database Setup Instructions

## Old Connections Removed ✅
- Supabase connection completely removed
- Environment variables cleared
- Dependencies removed from package.json

## New Database Connection Setup

### Step 1: Choose Your Database
Select one of these popular options:

#### PostgreSQL
```bash
npm install pg @types/pg
```

#### MySQL
```bash
npm install mysql2 @types/mysql2
```

#### MongoDB
```bash
npm install mongodb @types/mongodb
```

#### SQLite (for development)
```bash
npm install sqlite3 @types/sqlite3
```

### Step 2: Update Environment Variables
Add these to your `.env` file:

```env
DATABASE_HOST=your_database_host
DATABASE_PORT=your_database_port
DATABASE_NAME=your_database_name
DATABASE_USER=your_username
DATABASE_PASSWORD=your_password
```

### Step 3: Update Database Client
Edit `src/lib/database.ts` and implement the connection logic for your chosen database.

### Step 4: Update Your Hooks
Update these files to use the new database client:
- `src/hooks/useAuth.tsx`
- `src/hooks/useClients.ts`
- `src/hooks/useInvoices.ts`
- `src/hooks/useProjects.ts`
- `src/hooks/useTools.ts`

### Step 5: Install Dependencies
```bash
npm install
# or
bun install
```

## Next Steps
1. Choose your database provider
2. Set up database credentials
3. Update the database client implementation
4. Test the connection
5. Update all hooks to use new database methods