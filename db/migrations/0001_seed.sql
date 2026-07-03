-- Sample catalog data so the marketplace isn't empty on first load.
-- Safe to re-run: guarded with "on conflict do nothing" where there's a unique key.

insert into categories (name, slug, image) values
  ('Electronics', 'electronics', null),
  ('Fashion', 'fashion', null),
  ('Home & Living', 'home', null),
  ('Auto Parts', 'auto', null),
  ('Beauty', 'beauty', null),
  ('Groceries', 'groceries', null)
on conflict (slug) do nothing;

insert into products (name, description, price, compare_price, image, category_slug, vendor, rating, review_count, layby_months, featured, is_deal, stock) values
  ('Wireless Bluetooth Earbuds', 'Noise-cancelling earbuds with 24hr battery life', 250, 350, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600', 'electronics', 'TechHub Zambia', 4.6, 128, 3, true, true, 80),
  ('Smart Watch Series 5', 'Fitness tracking smartwatch with heart-rate monitor', 480, 650, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600', 'electronics', 'TechHub Zambia', 4.4, 76, 6, true, false, 40),
  ('Men''s Ankara Print Shirt', 'Premium African print casual shirt', 180, null, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600', 'fashion', 'Lusaka Threads', 4.7, 54, null, true, false, 60),
  ('Ladies Handbag', 'Genuine leather tote bag', 320, 400, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600', 'fashion', 'Lusaka Threads', 4.5, 39, null, false, true, 25),
  ('Non-Stick Cookware Set (10pc)', 'Complete kitchen cookware set', 650, 800, 'https://images.unsplash.com/photo-1584990347449-a5d9f800a783?w=600', 'home', 'HomeStyle', 4.8, 92, 6, true, true, 30),
  ('LED Ceiling Light', 'Modern energy-saving LED ceiling fixture', 220, null, 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=600', 'home', 'HomeStyle', 4.3, 21, null, false, false, 50),
  ('Car Seat Covers (Set)', 'Universal fit breathable seat covers', 380, 450, 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600', 'auto', 'AutoParts Direct', 4.2, 18, null, false, true, 20),
  ('LED Headlight Bulbs', 'High brightness H4 LED bulb pair', 150, null, 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=600', 'auto', 'AutoParts Direct', 4.1, 33, null, false, false, 70),
  ('Organic Skincare Set', 'Natural ingredients skincare bundle', 290, 360, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600', 'beauty', 'Glow Naturals', 4.9, 145, null, true, true, 45),
  ('50kg Bag of Mealie Meal', 'Premium roller meal, bulk pack', 420, null, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600', 'groceries', 'PEZA Farms', 4.6, 67, null, true, false, 100)
;

insert into suppliers (name, city, country, verified, rating, description, min_order, lead_time, category) values
  ('Shenzhen Electronics Co.', 'Shenzhen', 'China', true, 4.7, 'Wholesale electronics and gadgets manufacturer', '$500', '15-25 days', 'Electronics'),
  ('Mumbai Textiles Ltd.', 'Mumbai', 'India', true, 4.5, 'Bulk fashion and textile exports', '$300', '18-28 days', 'Fashion'),
  ('Dubai Trading House', 'Dubai', 'UAE', true, 4.8, 'General merchandise and home goods trading', '$400', '10-18 days', 'Home & Living'),
  ('Istanbul Auto Parts', 'Istanbul', 'Turkey', false, 4.2, 'Genuine and aftermarket auto parts', '$250', '20-30 days', 'Auto Parts'),
  ('Johannesburg Wholesale', 'Johannesburg', 'South Africa', true, 4.6, 'Regional distributor for consumer goods', '$200', '5-10 days', 'All')
;

insert into market_prices (category, item, price, change, is_up) values
  ('commodities', 'Maize (50kg)', 'K420', '+2.1%', true),
  ('commodities', 'Soya Beans (50kg)', 'K680', '-1.4%', false),
  ('commodities', 'Groundnuts (50kg)', 'K550', '0.0%', null),
  ('commodities', 'Copper (per tonne)', '$9,240', '+0.8%', true),
  ('fuel', 'Petrol (per litre)', 'K27.50', '+0.5%', true),
  ('fuel', 'Diesel (per litre)', 'K26.90', '-0.3%', false),
  ('fuel', 'Paraffin (per litre)', 'K18.20', '0.0%', null),
  ('currency', 'USD/ZMW', '26.45', '+0.3%', true),
  ('currency', 'ZAR/ZMW', '1.42', '-0.1%', false),
  ('currency', 'GBP/ZMW', '33.60', '+0.4%', true)
;

insert into jobs (title, company, category, location, type, salary, description, requirements, urgent) values
  ('Plumber Needed', 'Lusaka Home Services', 'Plumbing', 'Lusaka', 'Contract', 'K150-250/day', 'Experienced plumber needed for residential installations and repairs.', '["3+ years experience", "Own tools", "Available weekends"]', true),
  ('Junior Web Developer', 'Zed Tech Solutions', 'Tech', 'Lusaka (Remote)', 'Full-time', 'K8,000-12,000/mo', 'React/Node developer for growing fintech startup.', '["JavaScript/TypeScript", "React experience", "Portfolio required"]', false),
  ('House Cleaner', 'CleanPro Zambia', 'Cleaning', 'Kitwe', 'Part-time', 'K80-120/day', 'Reliable house cleaner for weekly residential contracts.', '["References required", "Own transport preferred"]', false),
  ('Delivery Rider', 'QuickDeliver', 'Delivery', 'Ndola', 'Full-time', 'K3,500-5,000/mo', 'Motorbike delivery rider for e-commerce fulfilment.', '["Valid motorbike license", "Own motorbike"]', true),
  ('Electrician', 'PowerFix Zambia', 'Electrical', 'Lusaka', 'Contract', 'K200-300/day', 'Certified electrician for commercial wiring projects.', '["Certified", "5+ years experience"]', false)
;
