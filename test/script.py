import csv

def process_csv(file_path, output_sql_file):
    elements = []  # To store elements
    tags = {}      # To store tags with their IDs
    prices = []    # To store price-related entries (optional)
    current_tag = None

    with open(file_path, "r", encoding="cp1252") as file:
        reader = csv.reader(file, delimiter=";")
        for row in reader:
            # Skip entirely empty rows
            if not row or all(not cell.strip() for cell in row):
                continue

            # Extract and clean up row data
            code = row[0].strip()
            name = row[1].strip()
            unit = row[2].strip() if len(row) > 2 else ""

            # Check if the row is a tag separator (empty unit indicates a tag header)
            if unit == "":
                current_tag = name  # Update the current tag
                if current_tag not in tags:
                    tags[current_tag] = len(tags) + 1  # Assign a unique ID
                continue

            # If it's not a tag separator, treat it as an element
            if current_tag:
                elements.append((code, name, unit, current_tag))

    # Generate SQL script
    with open(output_sql_file, "w", encoding="cp1252") as sql_file:
        sql_file.write("-- Generated SQL script to populate the database\n\n")

        # Create tables
        sql_file.write("""
CREATE TABLE elements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL
);

CREATE TABLE tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE element_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    element_id INT NOT NULL,
    tag_id INT NOT NULL,
    FOREIGN KEY (element_id) REFERENCES elements(id),
    FOREIGN KEY (tag_id) REFERENCES tags(id)
);

CREATE TABLE prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    element_id INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE DEFAULT NULL,
    FOREIGN KEY (element_id) REFERENCES elements(id)
);
""")

        # Insert tags
        sql_file.write("\n-- Insert tags\n")
        sql_file.write("INSERT INTO tags (id, name) VALUES\n")
        tag_values = [f"({tag_id}, '{tag}')" for tag, tag_id in tags.items()]
        sql_file.write(",\n".join(tag_values) + ";\n")

        # Insert elements
        sql_file.write("\n-- Insert elements\n")
        sql_file.write("INSERT INTO elements (name, unit) VALUES\n")
        element_values = [f"('{name}', '{unit}')" for _, name, unit, _ in elements]
        sql_file.write(",\n".join(element_values) + ";\n")

        # Map elements to tags
        sql_file.write("\n-- Map elements to tags\n")
        sql_file.write("INSERT INTO element_tags (element_id, tag_id) VALUES\n")
        element_tag_mappings = [
            f"({i + 1}, {tags[tag]})" for i, (_, _, _, tag) in enumerate(elements)
        ]
        sql_file.write(",\n".join(element_tag_mappings) + ";\n")

    print(f"Processed {len(elements)} elements across {len(tags)} tags. SQL script saved to {output_sql_file}")

# Example usage
process_csv("construction_materials.csv", "populate_elements2.sql")
