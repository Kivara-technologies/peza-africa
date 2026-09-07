INSERT INTO categories (name, slug, image) VALUES
  ('Phones & Electronics', 'electronics', NULL),
  ('Fashion', 'fashion', NULL),
  ('Home & Living', 'home', NULL),
  ('Auto Parts', 'auto', NULL),
  ('Beauty', 'beauty', NULL),
  ('Groceries', 'groceries', NULL)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products
  (name, description, price, compare_price, image, category_slug, vendor, whatsapp_number, rating, review_count, layby_months, featured, is_deal, stock)
VALUES
  ('Samsung Galaxy A06 (64GB)', 'Entry-level Android phone with 5000mAh battery and dual SIM. A strong starter smartphone for Lusaka households.', 1650, 1950, 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600', 'electronics', 'Lusaka Mobile Traders', '260570230160', 4.4, 61, 3, true, true, 35),
  ('Samsung Galaxy A06 (128GB)', 'Bigger storage version of the A06 with improved performance for work, study and social media use.', 2600, 2900, 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600', 'electronics', 'Lusaka Mobile Traders', '260570230160', 4.5, 44, 6, true, false, 25),
  ('Wireless Bluetooth Earbuds', 'Noise-cancelling earbuds with 24-hour battery life for calls, music and commuting.', 250, 350, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600', 'electronics', 'TechHub Zambia', '260570230160', 4.6, 128, 3, true, true, 80),
  ('20,000mAh Power Bank', 'Fast-charging power bank with dual USB output for load-shedding days and travel.', 320, 420, 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600', 'electronics', 'TechHub Zambia', '260570230160', 4.5, 58, NULL, false, true, 60),
  ('32-inch LED TV', 'HD-ready smart LED television with built-in apps for everyday family viewing.', 1850, 2200, 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600', 'electronics', 'Kalingalinga Electronics', '260570230160', 4.3, 29, 6, false, false, 15),
  ('Men''s Ankara Print Shirt', 'Premium African print casual shirt with a stylish, comfortable fit for everyday wear.', 180, NULL, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600', 'fashion', 'Lusaka Threads', '260570230160', 4.7, 54, NULL, true, false, 60),
  ('Ladies Handbag', 'Genuine leather tote bag for everyday use, office wear and weekend outings.', 320, 400, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600', 'fashion', 'Lusaka Threads', '260570230160', 4.5, 39, NULL, false, true, 25),
  ('Chitenge Fabric (6 yards)', 'Vibrant wax-print chitenge ideal for outfits, home decor and festive occasions.', 150, 190, 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600', 'fashion', 'Kabwata Fabrics', '260570230160', 4.6, 47, NULL, true, false, 90),
  ('Men''s Leather Sandals', 'Handmade genuine leather sandals built for comfort and long daily wear.', 220, NULL, 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600', 'fashion', 'Lusaka Threads', '260570230160', 4.2, 22, NULL, false, false, 40),
  ('Non-Stick Cookware Set (10pc)', 'Complete kitchen cookware set designed for family cooking and everyday meal prep.', 650, 800, 'https://images.unsplash.com/photo-1584990347449-a5d9f800a783?w=600', 'home', 'HomeStyle', '260570230160', 4.8, 92, 6, true, true, 30),
  ('LED Ceiling Light', 'Modern energy-saving LED ceiling fixture for homes, shops and offices.', 220, NULL, 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=600', 'home', 'HomeStyle', '260570230160', 4.3, 21, NULL, false, false, 50),
  ('Solar-Powered Home Lighting Kit', '4-bulb solar power kit with USB charging port for load-shedding reliability.', 780, 950, 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600', 'home', 'HomeStyle', '260570230160', 4.7, 63, 6, true, true, 20),
  ('3-Piece Sofa Set', 'Fabric upholstered living room sofa set that adds comfort and value to a modest home.', 4200, 4900, 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600', 'home', 'HomeStyle', '260570230160', 4.4, 18, 12, false, false, 8),
  ('Car Seat Covers (Set)', 'Universal fit breathable seat covers for daily commuting and cleaner car interiors.', 380, 450, 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600', 'auto', 'AutoParts Direct', '260570230160', 4.2, 18, NULL, false, true, 20),
  ('LED Headlight Bulbs', 'High brightness H4 LED bulb pair designed for safer night driving.', 150, NULL, 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=600', 'auto', 'AutoParts Direct', '260570230160', 4.1, 33, NULL, false, false, 70),
  ('Car Battery 12V 65Ah', 'Maintenance-free car battery with 2-year warranty for everyday Zambian road use.', 980, 1150, 'https://images.unsplash.com/photo-1617886322168-72b886573c35?w=600', 'auto', 'AutoParts Direct', '260570230160', 4.5, 27, NULL, true, false, 18),
  ('Organic Skincare Set', 'Natural ingredients skincare bundle designed for hydration, repair and daily use.', 290, 360, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600', 'beauty', 'Glow Naturals', '260570230160', 4.9, 145, NULL, true, true, 45),
  ('Shea Butter & Cocoa Body Cream', 'Locally-sourced shea butter moisturizer in a 500ml pack for dry skin and daily care.', 95, 120, 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600', 'beauty', 'Glow Naturals', '260570230160', 4.6, 88, NULL, false, false, 70),
  ('25kg Breakfast Mealie Meal', 'Premium breakfast roller meal in a bulk pack for households and small food businesses.', 220, NULL, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600', 'groceries', 'PEZA Farms', '260570230160', 4.6, 67, NULL, true, false, 100),
  ('20L Cooking Oil (Cooking Fat)', 'Bulk vegetable cooking oil perfect for households, restaurants and food service use.', 480, 540, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600', 'groceries', 'PEZA Farms', '260570230160', 4.5, 39, NULL, true, true, 40)
ON CONFLICT DO NOTHING;
