-- Enable UUID generator (Native in PostgreSQL 13+)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS (Custom Types for Status Tracking)
CREATE TYPE user_role AS ENUM ('admin', 'driver', 'warehouse');
CREATE TYPE van_status AS ENUM ('available', 'on_route', 'maintenance');
CREATE TYPE trip_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE delivery_status AS ENUM ('pending', 'delivered', 'failed', 'skipped');

-- 2. USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'driver',
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. VANS TABLE
CREATE TABLE vans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    model VARCHAR(50),
    max_jug_capacity INT NOT NULL CHECK (max_jug_capacity > 0),
    status van_status DEFAULT 'available',
    current_driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. WAREHOUSE INVENTORY (Central Stock Level)
CREATE TABLE warehouse_inventory (
    id SERIAL PRIMARY KEY,
    location_name VARCHAR(100) NOT NULL DEFAULT 'Main Warehouse',
    full_jugs INT NOT NULL DEFAULT 0 CHECK (full_jugs >= 0),
    empty_jugs INT NOT NULL DEFAULT 0 CHECK (empty_jugs >= 0),
    damaged_jugs INT NOT NULL DEFAULT 0 CHECK (damaged_jugs >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initialize default warehouse stock record
INSERT INTO warehouse_inventory (location_name, full_jugs, empty_jugs, damaged_jugs) 
VALUES ('Main Warehouse', 500, 100, 0);

-- 5. CUSTOMERS TABLE
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20),
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    -- Track balance: How many empty jugs the customer currently owes / holds
    empty_jugs_held INT DEFAULT 0 CHECK (empty_jugs_held >= 0), 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. DELIVERY TRIPS (Van route tracking)
CREATE TABLE delivery_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    van_id UUID NOT NULL REFERENCES vans(id),
    driver_id UUID NOT NULL REFERENCES users(id),
    status trip_status DEFAULT 'planned',
    
    -- Stock loaded onto van at trip start
    loaded_full_jugs INT NOT NULL DEFAULT 0 CHECK (loaded_full_jugs >= 0),
    loaded_empty_jugs INT NOT NULL DEFAULT 0 CHECK (loaded_empty_jugs >= 0),
    
    -- Stock returned to warehouse at trip end
    returned_full_jugs INT DEFAULT 0 CHECK (returned_full_jugs >= 0),
    returned_empty_jugs INT DEFAULT 0 CHECK (returned_empty_jugs >= 0),
    returned_damaged_jugs INT DEFAULT 0 CHECK (returned_damaged_jugs >= 0),
    
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. DELIVERIES (Individual Customer Stops)
CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES delivery_trips(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id),
    stop_order INT NOT NULL, -- Sequence order (1, 2, 3...)
    status delivery_status DEFAULT 'pending',
    
    -- Quantity exchange
    full_jugs_delivered INT DEFAULT 0 CHECK (full_jugs_delivered >= 0),
    empty_jugs_collected INT DEFAULT 0 CHECK (empty_jugs_collected >= 0),
    damaged_jugs_collected INT DEFAULT 0 CHECK (damaged_jugs_collected >= 0),
    
    notes TEXT,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. INVENTORY TRANSACTIONS LOG (Audit Trail)
-- Useful to track refills, purchases of new jugs, or scrapped broken jugs
CREATE TABLE inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type VARCHAR(50) NOT NULL, -- e.g., 'REFILL_PURCHASE', 'SCRAP_DAMAGED', 'TRIP_DISPATCH'
    full_jugs_change INT DEFAULT 0,
    empty_jugs_change INT DEFAULT 0,
    damaged_jugs_change INT DEFAULT 0,
    performed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES for Web App Performance
CREATE INDEX idx_deliveries_trip_id ON deliveries(trip_id);
CREATE INDEX idx_delivery_trips_driver_id ON delivery_trips(driver_id);
CREATE INDEX idx_delivery_trips_van_id ON delivery_trips(van_id);
CREATE INDEX idx_customers_coords ON customers(latitude, longitude);