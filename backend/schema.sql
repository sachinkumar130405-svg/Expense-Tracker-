CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT false
);

CREATE TABLE allowances (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    initial_balance DECIMAL(10, 2) NOT NULL,
    UNIQUE(user_id, month, year)
);

CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    paid_by INTEGER REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE expense_splits (
    id SERIAL PRIMARY KEY,
    expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE,
    owed_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    is_settled BOOLEAN DEFAULT false
);

-- Insert default users for MVP
INSERT INTO users (id, name, email) VALUES
    (1, 'Sachin Kumar', 'sachin@example.com'),
    (2, 'Roommate', 'roommate@example.com');

-- Insert default categories
INSERT INTO categories (name, is_default) VALUES
    ('Food', true),
    ('Transport', true),
    ('Academics', true),
    ('Others', true);
