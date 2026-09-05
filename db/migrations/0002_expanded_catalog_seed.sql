-- Expanded demo catalog: realistic Zambian product names, categories and
-- market-accurate pricing (grounded against Sep 2026 Lusaka retail listings),
-- using generic placeholder vendor names and licensed Unsplash stock photos.
--
-- IMPORTANT: none of this is scraped from a real business's Facebook/Instagram
-- page. Vendor names are illustrative placeholders, not real companies.
-- Swap each row's vendor/image/whatsapp_number for a real supplier's own
-- assets only after they've agreed to be listed (see supplier-outreach-kit.md).
-- Safe to re-run: guarded with "on conflict do nothing" where possible.

insert into categories (name, slug, image) values
  ('Phones & Electronics', 'electronics', null),
  ('Fashion', 'fashion', null),
  ('Home & Living', 'home', null),
  ('Auto Parts', 'auto', null),
  ('Beauty', 'beauty', null),
  ('Groceries', 'groceries', null),
  ('Farm & Agro', 'agro', null),
  ('Baby & Kids', 'baby-kids', null)
on conflict (slug) do nothing;

insert into products
  (name, description, price, compare_price, image, category_slug, vendor, whatsapp_number, rating, review_count, layby_months, featured, is_deal, stock)
values
  -- Phones & Electronics (priced against actual Sep 2026 Lusaka street listings)
  ('Samsung Galaxy A06 (64GB)', 'Entry-level Android, 5000mAh battery, dual SIM. Popular first-smartphone pick in Lusaka.', 1650, 1950, 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600', 'electronics', 'Lusaka Mobile Traders', '260570230160', 4.4, 61, 3, true, true, 35),
  ('Samsung Galaxy A06 (128GB)', 'Bigger storage variant of the A06, MediaTek Helio G85, 50MP main camera.', 2600, 2900, 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600', 'electronics', 'Lusaka Mobile Traders', '260570230160', 4.5, 44, 6, true, false, 25),
  ('Wireless Bluetooth Earbuds', 'Noise-cancelling earbuds with 24hr battery life', 250, 350, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600', 'electronics', 'TechHub Zambia', '260570230160', 4.6, 128, 3, true, true, 80),
  ('Smart Watch Series 5', 'Fitness tracking smartwatch with heart-rate monitor', 480, 650, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600', 'electronics', 'TechHub Zambia', '260570230160', 4.4, 76, 6, true, false, 40),
  ('20,000mAh Power Bank', 'Fast-charging power bank, dual USB output — built for load-shedding days', 320, 420, 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600', 'electronics', 'TechHub Zambia', '260570230160', 4.5, 58, null, false, true, 60),
  ('32-inch LED TV', 'HD-ready smart LED television with built-in apps', 1850, 2200, 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600', 'electronics', 'Kalingalinga Electronics', '260570230160', 4.3, 29, 6, false, false, 15),

  -- Fashion
  ("Men's Ankara Print Shirt", 'Premium African print casual shirt', 180, null, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600', 'fashion', 'Lusaka Threads', '260570230160', 4.7, 54, null, true, false, 60),
  ('Ladies Handbag', 'Genuine leather tote bag', 320, 400, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600', 'fashion', 'Lusaka Threads', '260570230160', 4.5, 39, null, false, true, 25),
  ('Chitenge Fabric (6 yards)', 'Vibrant wax-print chitenge, ideal for outfits or home decor', 150, 190, 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600', 'fashion', 'Kabwata Fabrics', '260570230160', 4.6, 47, null, true, false, 90),
  ("Men's Leather Sandals", 'Handmade genuine leather sandals', 220, null, 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600', 'fashion', 'Lusaka Threads', '260570230160', 4.2, 22, null, false, false, 40),

  -- Home & Living
  ('Non-Stick Cookware Set (10pc)', 'Complete kitchen cookware set', 650, 800, 'https://images.unsplash.com/photo-1584990347449-a5d9f800a783?w=600', 'home', 'HomeStyle', '260570230160', 4.8, 92, 6, true, true, 30),
  ('LED Ceiling Light', 'Modern energy-saving LED ceiling fixture', 220, null, 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=600', 'home', 'HomeStyle', '260570230160', 4.3, 21, null, false, false, 50),
  ('Solar-Powered Home Lighting Kit', '4-bulb solar kit with USB charging port — built for load-shedding', 780, 950, 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600', 'home', 'HomeStyle', '260570230160', 4.7, 63, 6, true, true, 20),
  ('3-Piece Sofa Set', 'Fabric upholstered living room sofa set', 4200, 4900, 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600', 'home', 'HomeStyle', '260570230160', 4.4, 18, 12, false, false, 8),

  -- Auto Parts
  ('Car Seat Covers (Set)', 'Universal fit breathable seat covers', 380, 450, 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600', 'auto', 'AutoParts Direct', '260570230160', 4.2, 18, null, false, true, 20),
  ('LED Headlight Bulbs', 'High brightness H4 LED bulb pair', 150, null, 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=600', 'auto', 'AutoParts Direct', '260570230160', 4.1, 33, null, false, false, 70),
  ('Car Battery 12V 65Ah', 'Maintenance-free car battery, 2-year warranty', 980, 1150, 'https://images.unsplash.com/photo-1617886322168-72b886573c35?w=600', 'auto', 'AutoParts Direct', '260570230160', 4.5, 27, null, true, false, 18),

  -- Beauty
  ('Organic Skincare Set', 'Natural ingredients skincare bundle', 290, 360, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600', 'beauty', 'Glow Naturals', '260570230160', 4.9, 145, null, true, true, 45),
  ('Shea Butter & Cocoa Body Cream', 'Locally-sourced shea butter moisturizer, 500ml', 95, 120, 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600', 'beauty', 'Glow Naturals', '260570230160', 4.6, 88, null, false, false, 70),
  ('Braiding Hair Extensions (Bundle)', 'Synthetic braiding hair, various colors', 130, null, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600', 'beauty', 'Glow Naturals', '260570230160', 4.3, 41, null, false, false, 55),

  -- Groceries (pricing checked against Sep 2026 Lusaka mealie-meal rates)
  ('25kg Breakfast Mealie Meal', 'Premium breakfast roller meal, bulk pack', 220, null, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600', 'groceries', 'PEZA Farms', '260570230160', 4.6, 67, null, true, false, 100),
  ('20L Cooking Oil (Cooking Fat)', 'Bulk vegetable cooking oil for households and restaurants', 480, 540, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600', 'groceries', 'PEZA Farms', '260570230160', 4.5, 39, null, true, true, 40),
  ('10kg Rice (Premium)', 'Long grain white rice, bulk pack', 195, null, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600', 'groceries', 'PEZA Farms', '260570230160', 4.4, 31, null, false, false, 60),
  ('Sugar 50kg Bag', 'Granulated white sugar, wholesale bag', 650, null, 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=600', 'groceries', 'PEZA Farms', '260570230160', 4.3, 22, null, false, false, 25),

  -- Farm & Agro
  ('Layer Chicken Feed (50kg)', 'Balanced feed for egg-laying poultry', 340, null, 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600', 'agro', 'PEZA Farms', '260570230160', 4.5, 26, null, true, false, 45),
  ('Day-Old Broiler Chicks (50-pack)', 'Healthy vaccinated broiler chicks', 850, null, 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600', 'agro', 'PEZA Farms', '260570230160', 4.6, 19, null, false, false, 20),
  ('Hybrid Maize Seed (10kg)', 'High-yield certified maize seed for the planting season', 480, 550, 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=600', 'agro', 'PEZA Farms', '260570230160', 4.7, 34, null, true, true, 50),

  -- Baby & Kids
  ('Baby Diapers (Size 3, Pack of 50)', 'Soft, absorbent disposable diapers', 145, 170, 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=600', 'baby-kids', 'Little Ones Zambia', '260570230160', 4.6, 52, null, true, true, 65),
  ('Baby Stroller', 'Lightweight foldable stroller with sun canopy', 950, 1150, 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600', 'baby-kids', 'Little Ones Zambia', '260570230160', 4.4, 17, 6, false, false, 12)
;
