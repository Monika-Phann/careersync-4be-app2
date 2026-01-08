-- Migration: Make schedule_timeslot_id nullable in Booking table
-- This allows timeslots to be deleted while keeping booking records
-- Run this script once on your database

-- Step 1: Make schedule_timeslot_id nullable
ALTER TABLE "Booking" 
ALTER COLUMN schedule_timeslot_id DROP NOT NULL;

-- Step 2: Update foreign key constraint to allow ON DELETE SET NULL
-- Drop existing constraint
ALTER TABLE "Booking" 
DROP CONSTRAINT IF EXISTS "Booking_schedule_timeslot_id_fkey";

-- Add new constraint with ON DELETE SET NULL
ALTER TABLE "Booking" 
ADD CONSTRAINT "Booking_schedule_timeslot_id_fkey" 
FOREIGN KEY (schedule_timeslot_id) 
REFERENCES "Schedule_Timeslot"(id) 
ON UPDATE CASCADE 
ON DELETE SET NULL;

-- Note: After this migration:
-- 1. schedule_timeslot_id can be NULL (allows deletion of timeslots)
-- 2. When a timeslot is deleted, the booking's schedule_timeslot_id will be set to NULL automatically
-- 3. All booking snapshot data is preserved


