-- Enable Supabase Realtime on the notifications table
-- Run this in the Supabase SQL Editor after 001_initial.sql

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Optional: also stream goal/approval changes for future use
ALTER PUBLICATION supabase_realtime ADD TABLE goals;
ALTER PUBLICATION supabase_realtime ADD TABLE approvals;
