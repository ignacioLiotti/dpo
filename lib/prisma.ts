-- Create obras table
DROP TABLE IF EXISTS obras CASCADE;
CREATE TABLE obras (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  ubicacion VARCHAR(200),
  empresa VARCHAR(100),
  fecha_inicio TIMESTAMP WITH TIME ZONE,
  fecha_fin TIMESTAMP WITH TIME ZONE,
  estado VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create items table
DROP TABLE IF EXISTS items CASCADE;
CREATE TABLE items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  unidad VARCHAR(20) NOT NULL,
  categoria VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create precios table
DROP TABLE IF EXISTS precios CASCADE  ;
CREATE TABLE precios (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  item_id BIGINT REFERENCES items(id) ON DELETE CASCADE,
  precio DECIMAL(15,2) NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Simplified presupuestos table with JSONB
DROP TABLE IF EXISTS presupuestos CASCADE ;
CREATE TABLE presupuestos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  obra_id BIGINT REFERENCES obras(id) ON DELETE CASCADE,
  nombre VARCHAR(200) NOT NULL,
  total DECIMAL(15,2) NOT NULL,
  data JSONB NOT NULL, -- Store all sections and items here
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Simplified mediciones table with JSONB
DROP TABLE IF EXISTS mediciones CASCADE;
CREATE TABLE mediciones (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  obra_id BIGINT REFERENCES obras(id) ON DELETE CASCADE,
  periodo TIMESTAMP WITH TIME ZONE NOT NULL,
  data JSONB NOT NULL, -- Store all measurements here
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

// -- Create RLS policies
// ALTER TABLE obras ENABLE ROW LEVEL SECURITY;
// ALTER TABLE items ENABLE ROW LEVEL SECURITY;
// ALTER TABLE precios ENABLE ROW LEVEL SECURITY;
// ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
// ALTER TABLE mediciones ENABLE ROW LEVEL SECURITY;
// ALTER TABLE medicion_items ENABLE ROW LEVEL SECURITY;

// -- Create basic policies (you might want to adjust these based on your needs)
// CREATE POLICY "Enable read access for all users" ON obras FOR SELECT USING (true);
// CREATE POLICY "Enable read access for all users" ON items FOR SELECT USING (true);
// CREATE POLICY "Enable read access for all users" ON precios FOR SELECT USING (true);
// CREATE POLICY "Enable read access for all users" ON presupuestos FOR SELECT USING (true);
// CREATE POLICY "Enable read access for all users" ON mediciones FOR SELECT USING (true);
// CREATE POLICY "Enable read access for all users" ON medicion_items FOR SELECT USING (true);

// -- Add update triggers for updated_at
// CREATE OR REPLACE FUNCTION update_updated_at_column()
// RETURNS TRIGGER AS $$
// BEGIN
//     NEW.updated_at = now();
//     RETURN NEW;
// END;
// $$ language 'plpgsql';

// CREATE TRIGGER update_obras_updated_at
//     BEFORE UPDATE ON obras
//     FOR EACH ROW
//     EXECUTE PROCEDURE update_updated_at_column();

// -- Repeat for other tables...