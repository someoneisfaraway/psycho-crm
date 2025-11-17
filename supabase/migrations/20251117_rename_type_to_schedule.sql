-- Rename column 'type' to 'schedule' in clients table
ALTER TABLE clients RENAME COLUMN type TO schedule;

-- Optional: if enum or constraints are needed, they should be added separately.
