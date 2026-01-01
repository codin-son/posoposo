CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('superadmin', 'boss', 'staff');
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');
CREATE TYPE attendance_status AS ENUM ('present', 'late', 'absent', 'leave');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'staff',
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
    image_url VARCHAR(500),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE,
    name VARCHAR(100) NOT NULL,
    type discount_type NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number SERIAL,
    customer_name VARCHAR(100),
    staff_id UUID REFERENCES users(id),
    subtotal DECIMAL(10, 2) NOT NULL,
    discount_id UUID REFERENCES discounts(id),
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    sst_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_received DECIMAL(10, 2) NOT NULL,
    change_given DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id),
    item_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    notes TEXT
);

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    clock_in TIMESTAMP WITH TIME ZONE,
    clock_out TIMESTAMP WITH TIME ZONE,
    clock_in_selfie VARCHAR(500),
    clock_out_selfie VARCHAR(500),
    status attendance_status DEFAULT 'present',
    notes TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_staff_id ON orders(staff_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);

INSERT INTO users (username, password, role, full_name, phone)
VALUES ('admin', '$2b$10$p2REe6HkcrZOQrLO09PFwenRJbX.p7iBFIbtKl29uRFJyFwJ18Hc2', 'superadmin', 'System Administrator', '0123456789');

INSERT INTO menu_categories (name, display_order) VALUES
('Appetizers', 1),
('Main Course', 2),
('Beverages', 3),
('Desserts', 4),
('Sides', 5);

INSERT INTO system_settings (key, value) VALUES
('sst_rate', '0'),
('restaurant_name', 'Western Restaurant'),
('currency', 'RM'),
('work_start_time', '09:00'),
('late_threshold_minutes', '15');
