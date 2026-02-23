-- ============================================
-- Appointment Booking System - Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Table: time_slots
-- Stores all available and booked time slots
CREATE TABLE IF NOT EXISTS time_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT 'Appointment Slot',
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),
  booked_by VARCHAR(255),
  booked_by_email VARCHAR(255),
  booked_at TIMESTAMPTZ,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: bookings
-- Stores confirmed appointment bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id UUID NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50),
  notes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_time_slots_date ON time_slots(date);
CREATE INDEX IF NOT EXISTS idx_time_slots_status ON time_slots(status);
CREATE INDEX IF NOT EXISTS idx_bookings_slot_id ON bookings(slot_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_time_slots_updated_at
  BEFORE UPDATE ON time_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional but recommended)
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all operations for now (restrict in production)
CREATE POLICY "Allow all for time_slots" ON time_slots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for bookings" ON bookings FOR ALL USING (true) WITH CHECK (true);
