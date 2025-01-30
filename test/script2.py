import re

def parse_sql_file(filename):
    data = []
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
        inserts = re.findall(r'INSERT INTO.*?VALUES\s*\((.*?)\);', content, re.DOTALL)
        for insert in inserts:
            values = re.split(r',\s*(?=(?:[^\']*\'[^\']*\')*[^\']*$)', insert)
            values = [v.strip().strip("'").replace("'", "''") for v in values]
            data.append(values)
    return data

def clean_value(value):
    if value == 'NULL' or value == '' or value is None:
        return None
    value = re.sub(r'[$\s,]', '', str(value))
    try:
        return float(value)
    except ValueError:
        return value

def transform_prices_or_values(entity_id_column, entity_id, value, date, table_name):
    return f"""INSERT INTO {table_name} ({entity_id_column}, value, valid_from)
        VALUES ({entity_id}, {value}, '{date}')
        ON DUPLICATE KEY UPDATE value = {value};"""

def transform_entities(filename, table_name, time_series_table, entity_id_column):
    data = parse_sql_file(filename)
    inserts = []
    seen_entities = set()

    for row in data:
        if not row[0] or row[0] == 'NULL':
            continue

        code = row[0]
        name = (row[2] if len(row) > 2 else '').replace("'", "''")
        unit = (row[3] if len(row) > 3 else '').replace("'", "''")

        if code not in seen_entities:
            inserts.append(f"INSERT IGNORE INTO {table_name} (code, name, unit) VALUES ('{code}', '{name}', '{unit}');")
            seen_entities.add(code)

            for i in range(4, len(row)):
                value = clean_value(row[i])
                if value is not None:
                    year = 2009 + ((i - 4) // 12)
                    month = ((i - 4) % 12) + 1
                    date_str = f"{year}-{month:02d}-01"
                    inserts.append(transform_prices_or_values(entity_id_column, f"(SELECT id FROM {table_name} WHERE code = '{code}')", value, date_str, time_series_table))

    return inserts

def transform_jornales(filename):
    data = parse_sql_file(filename)
    inserts = []
    seen_workers = set()

    for row in data:
        if len(row) < 3:
            continue

        worker_type = row[1].replace("'", "''") if row[1] else None
        if not worker_type:
            continue

        if worker_type not in seen_workers:
            inserts.append(f"INSERT IGNORE INTO jornales (name) VALUES ('{worker_type}');")
            seen_workers.add(worker_type)

            for i in range(3, len(row) - 1, 2):
                daily = clean_value(row[i])
                hourly = clean_value(row[i + 1]) if i + 1 < len(row) else None

                if daily is not None and hourly is not None:
                    year = 2015 + ((i - 3) // 24)
                    month = ((i - 3) % 24) // 2 + 1
                    date_str = f"{year}-{month:02d}-01"
                    inserts.append(f"""INSERT INTO labor_rates (jornal_id, daily_rate, hourly_rate, valid_from)
                        VALUES ((SELECT id FROM jornales WHERE name = '{worker_type}'), {daily}, {hourly}, '{date_str}')
                        ON DUPLICATE KEY UPDATE daily_rate = {daily}, hourly_rate = {hourly};""")

    return inserts

def main():
    # Process each table
    materiales_inserts = transform_entities('precios (86).sql', 'materiales', 'material_prices', 'material_id')
    indices_inserts = transform_entities('precios (83).sql', 'indices', 'index_values', 'index_id')
    items_inserts = transform_entities('precios (84).sql', 'items', 'item_prices', 'item_id')
    jornales_inserts = transform_jornales('precios (85).sql')

    # Write SQL file
    with open('transformed_data2.sql', 'w', encoding='utf-8') as f:
        f.write('BEGIN;\n\n')
        f.write('\n-- Materials\n')
        f.write('\n'.join(materiales_inserts))
        f.write('\n\n-- Indices\n')
        f.write('\n'.join(indices_inserts))
        f.write('\n\n-- Items\n')
        f.write('\n'.join(items_inserts))
        f.write('\n\n-- Labor rates\n')
        f.write('\n'.join(jornales_inserts))
        f.write('\n\nCOMMIT;\n')

if __name__ == "__main__":
    main()
