-- Migration for example_documents table
-- Run this in Supabase SQL editor or add to migrations folder

CREATE TABLE IF NOT EXISTS example_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  title text NOT NULL,
  description text,
  content text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  category text NOT NULL,
  tags text[] DEFAULT '{}',
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_example_documents_author_id ON example_documents(author_id);
CREATE INDEX IF NOT EXISTS idx_example_documents_status ON example_documents(status);
CREATE INDEX IF NOT EXISTS idx_example_documents_category ON example_documents(category);
CREATE INDEX IF NOT EXISTS idx_example_documents_priority ON example_documents(priority);
CREATE INDEX IF NOT EXISTS idx_example_documents_due_date ON example_documents(due_date);
CREATE INDEX IF NOT EXISTS idx_example_documents_created_at ON example_documents(created_at);

-- Create a GIN index for full-text search on title and description
CREATE INDEX IF NOT EXISTS idx_example_documents_search ON example_documents 
USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Enable Row Level Security
ALTER TABLE example_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view all documents (adjust based on your needs)
CREATE POLICY "Anyone can view example documents" ON example_documents
  FOR SELECT USING (true);

-- Users can insert their own documents
CREATE POLICY "Users can insert their own example documents" ON example_documents
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Users can update their own documents
CREATE POLICY "Users can update their own example documents" ON example_documents
  FOR UPDATE USING (auth.uid() = author_id);

-- Users can delete their own documents
CREATE POLICY "Users can delete their own example documents" ON example_documents
  FOR DELETE USING (auth.uid() = author_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_example_documents_updated_at
  BEFORE UPDATE ON example_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();