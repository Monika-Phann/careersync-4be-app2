-- Migration: Update Booking foreign key constraint to allow timeslot deletion
-- This allows Schedule_Timeslot records to be deleted when booked
-- Run this script on your database to enable automatic timeslot deletion

-- Step 1: Drop the existing constraint
ALTER TABLE "Booking" 
DROP CONSTRAINT IF EXISTS "Booking_schedule_timeslot_id_fkey";

-- Step 2: Add the new constraint with ON DELETE SET NULL
-- Note: Since schedule_timeslot_id is NOT NULL in the Booking model,
-- we'll use CASCADE instead to delete the booking if timeslot is deleted,
-- OR we can make schedule_timeslot_id nullable first
-- For this use case, we want to keep the booking even if timeslot is deleted,
-- so we'll make schedule_timeslot_id nullable

-- First, make schedule_timeslot_id nullable
ALTER TABLE "Booking" 
ALTER COLUMN schedule_timeslot_id DROP NOT NULL;

-- Then add the constraint with ON DELETE SET NULL
ALTER TABLE "Booking" 
ADD CONSTRAINT "Booking_schedule_timeslot_id_fkey" 
FOREIGN KEY (schedule_timeslot_id) 
REFERENCES "Schedule_Timeslot"(id) 
ON UPDATE CASCADE 
ON DELETE SET NULL;

-- Note: After this migration, when a Schedule_Timeslot is deleted,
-- the Booking's schedule_timeslot_id will be set to NULL.
-- The Booking will still have all snapshot data, so it remains valid.

