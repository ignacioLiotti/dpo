# Database Migrations

This directory contains database migration files for the Supabase database.

## How to Apply Migrations

### Option 1: Using the Supabase Dashboard

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the contents of the migration file
5. Run the query

### Option 2: Using the Supabase CLI

If you have the Supabase CLI installed, you can apply migrations using the following commands:

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

## Migration Files

- `supabase/20240226_add_totals_to_mediciones.sql`: Adds total columns to the mediciones table
  - `avance_medicion`: Percentage of progress for the current measurement period
  - `avance_acumulado`: Accumulated percentage of progress up to this measurement
  - `presupuesto_total`: Total budget amount for reference

## Updating the Application

After applying the migrations, you may need to update your application code to use the new columns. The migration includes a trigger that will automatically calculate and update these values when a medicion is inserted or updated.

## Rollback

If you need to rollback a migration, you can create a new migration file with the reverse operations. For example, to rollback the `20240226_add_totals_to_mediciones.sql` migration, you would create a new file with:

```sql
-- Drop the trigger
DROP TRIGGER IF EXISTS medicion_totals_trigger ON mediciones;

-- Drop the function
DROP FUNCTION IF EXISTS update_medicion_totals();

-- Drop the columns
ALTER TABLE mediciones
  DROP COLUMN IF EXISTS avance_medicion,
  DROP COLUMN IF EXISTS avance_acumulado,
  DROP COLUMN IF EXISTS presupuesto_total;
```
