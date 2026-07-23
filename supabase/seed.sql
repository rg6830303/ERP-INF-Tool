-- ============================================================================
-- Infinity Exports ERP — Optional seed data (sample masters).
-- Run AFTER 0001–0004. Safe to skip in production. Runs as the postgres role
-- in the Supabase SQL editor (bypasses RLS), so created_by is left null.
-- ============================================================================

insert into public.buyers (buyer_code, name, contact_person, email, phone, country, currency)
values
  ('BUY-1001', 'Global Traders LLC',   'John Miller',   'john@globaltraders.com', '+1-202-555-0100', 'United States', 'USD'),
  ('BUY-1002', 'Emirates Imports FZE',  'Ahmed Khan',    'ahmed@emiratesimports.ae', '+971-4-555-0110', 'United Arab Emirates', 'USD'),
  ('BUY-1003', 'EuroSource GmbH',       'Lena Schmidt',  'lena@eurosource.de', '+49-30-555-0120', 'Germany', 'EUR')
on conflict (buyer_code) do nothing;

insert into public.suppliers (supplier_code, name, contact_person, email, phone, country)
values
  ('SUP-2001', 'Prime Manufacturing Co', 'Ravi Sharma', 'ravi@primemfg.in', '+91-22-555-0200', 'India'),
  ('SUP-2002', 'Sunrise Textiles',       'Meera Nair',  'meera@sunrisetex.in', '+91-44-555-0210', 'India')
on conflict (supplier_code) do nothing;

insert into public.items (item_code, name, description, hs_code, unit, category, default_unit_price, currency, reorder_level)
values
  ('ITM-3001', 'Cotton Bath Towel 500 GSM', 'Premium cotton bath towel', '6302.60', 'PCS', 'Textiles', 4.50, 'USD', 500),
  ('ITM-3002', 'Stainless Steel Cutlery Set', '24-piece SS cutlery set', '8215.20', 'SET', 'Kitchenware', 12.75, 'USD', 200),
  ('ITM-3003', 'Basmati Rice 25kg Bag',      'Aged basmati rice', '1006.30', 'BAG', 'Food Grains', 28.00, 'USD', 100)
on conflict (item_code) do nothing;

-- ----------------------------------------------------------------------------
-- FIRST ADMIN ACCOUNT
-- ----------------------------------------------------------------------------
-- Auth users cannot be created safely from raw SQL (password hashing / GoTrue).
-- Create the first admin one of these ways, then it is ready to log in:
--
--   A) CLI script (recommended):
--        npm run create-admin -- --username admin --password 'StrongPass!23' --name 'Head Office'
--
--   B) Supabase Dashboard → Authentication → Users → Add user:
--        Email:    admin@infinityexports.local   (username@AUTH_EMAIL_DOMAIN)
--        Password: <your choice>   ✔ Auto Confirm User
--      then promote to admin:
--        update public.profiles set role = 'admin'
--          where username = 'admin';
-- ----------------------------------------------------------------------------
