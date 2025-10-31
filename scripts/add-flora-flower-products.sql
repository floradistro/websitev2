-- Add 50 Premium Flower Products for Flora Distro
-- Vendor: Flora Distro (cd2e1122-d511-4edb-be5d-98ef274b4baf)
-- Category: Flower (296c87ce-a31b-43a3-b48f-52902134a723)
-- Pricing: Top Shelf (f408beb5-8ccf-45dd-9d98-6321d3d7fab7)

-- Insert Products
INSERT INTO products (
  vendor_id,
  category_id,
  name,
  slug,
  description,
  status,
  metadata
) VALUES

-- 1. Marshmallow Mountain
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Marshmallow Mountain', 'marshmallow-mountain',
'This ain''t your regular smoke. Marshmallow Mountain hits different - a sweet, creamy indica-dominant hybrid that''ll have you floating. Dense, frosted nugs covered in trichomes like fresh powder on a mountain peak. The nose is straight candy shop meets gas station, with that unique marshmallow sweetness cutting through loud earthy undertones. Perfect for when you need to decompress after a long day. This is that couch-lock medicine that still keeps your mind clear enough to enjoy the ride.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Caryophyllene", "Limonene", "Humulene"], "effects": ["Relaxing", "Happy", "Sleepy"], "lineage": "Triangle Kush x Animal Mints", "nose": "Sweet marshmallow, cream, earthy gas"}'::jsonb),

-- 2. Gelato 15
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Gelato 15', 'gelato-15',
'One of the original Gelato cuts that started it all. This phenotype is pure class - tight purple and green buds that reek of sweet berries and dessert. Gelato 15 brings that perfect balanced high, not too heavy, not too light. Just smooth, flavorful medicine that tastes as good as it looks. The terpene profile is insane - you get that sweet gelato flavor on the inhale with a gassy finish. This is top-shelf genetics from the Cookie Fam, no cap.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Caryophyllene", "Limonene", "Humulene"], "effects": ["Uplifting", "Happy", "Relaxing"], "lineage": "Sunset Sherbert x Thin Mint Cookies", "nose": "Sweet berries, orange citrus, creamy dessert"}'::jsonb),

-- 3. Sub Zero
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Sub Zero', 'sub-zero',
'Ice cold like the name. Sub Zero is that rare indica-leaning hybrid that brings the chill without putting you to sleep. Frosty white trichomes coat every inch of these dense nugs - looks like someone dipped them in sugar. The flavor profile is unique: minty fresh with undertones of pine and earth. This strain is perfect for evening sessions when you want to relax but stay social. Clean, potent smoke that doesn''t harsh on the throat.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Pinene", "Myrcene", "Caryophyllene"], "effects": ["Relaxing", "Focused", "Happy"], "lineage": "Northern Lights x Afghani", "nose": "Fresh mint, pine, earthy kush"}'::jsonb),

-- 4. White Truffle
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'White Truffle', 'white-truffle',
'Exotic doesn''t even begin to describe it. White Truffle is that new wave fire from the soil up. Gorilla Butter meets Peanut Butter Breath in this masterpiece that reeks of savory umami funk mixed with sweet earth. The buds are absolute units - fat, dense, and caked in resin. This is refined smoke for the connoisseur. The high hits cerebral first, then melts into your body. Limited drops, top genetics, this is what we do.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Caryophyllene", "Limonene", "Myrcene"], "effects": ["Euphoric", "Relaxing", "Creative"], "lineage": "Gorilla Butter x Peanut Butter Breath", "nose": "Savory truffle, earth, sweet fuel"}'::jsonb),

-- 5. Dixie Dust
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Dixie Dust', 'dixie-dust',
'Southern charm meets West Coast fire. Dixie Dust brings that old-school indica feeling with new-school bag appeal. These buds are dense, sticky, and covered in a blanket of trichomes that look like powdered sugar. The terp profile is straight gas station candy - sweet, fruity notes over a diesel backbone. This is night-time medicine that helps you unwind after a long day. Real deal therapeutic flower.',
'approved',
'{"strain_type": "Indica", "terpene_profile": ["Myrcene", "Caryophyllene", "Limonene"], "effects": ["Relaxing", "Sleepy", "Happy"], "lineage": "Bubba Kush x Strawberry Diesel", "nose": "Sweet strawberry, diesel fuel, earthy kush"}'::jsonb),

-- 6. Pink Runtz
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Pink Runtz', 'pink-runtz',
'The candy strain that broke the internet. Pink Runtz is everything you heard about and more. Vibrant purple and pink hues under a thick layer of frost. The smell is pure candy - think tropical fruit punch mixed with sugary sweetness. Smooth smoke that tastes exactly like it smells. Balanced hybrid high that keeps you lifted and creative while staying relaxed. This is verified exotic status, the type of flower that turns heads.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Caryophyllene", "Limonene", "Linalool"], "effects": ["Euphoric", "Happy", "Uplifting"], "lineage": "Rainbow Sherbet x Pink Panties", "nose": "Tropical candy, sweet berries, sugar"}'::jsonb),

-- 7. Lemon Cherry Diesel
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Lemon Cherry Diesel', 'lemon-cherry-diesel',
'A terp masterpiece. LCD brings that perfect combination of fruity sweetness and diesel funk. The lemon comes through first, followed by a cherry undertone, all backed by that classic diesel gas. Sativa-leaning hybrid that energizes without the anxiety. Perfect for daytime smoke sessions or getting creative in the studio. This is refined California genetics at its finest. The smoke is smooth, the flavor is loud, the high is clean.',
'approved',
'{"strain_type": "Sativa", "terpene_profile": ["Limonene", "Caryophyllene", "Myrcene"], "effects": ["Energizing", "Uplifting", "Creative"], "lineage": "Lemon Thai x Cherry Pie x Diesel", "nose": "Fresh lemon, ripe cherry, diesel gas"}'::jsonb),

-- 8. Sherb Cream Pie
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Sherb Cream Pie', 'sherb-cream-pie',
'Dessert in a jar. Sherb Cream Pie is that after-dinner smoke that hits just right. Creamy, sweet flavor profile with hints of vanilla and fresh berries. The buds are colorful - deep purples and bright greens all wrapped in crystal. This is smooth, potent flower that brings relaxation without the heavy couch-lock. Perfect for social settings or winding down in the evening. Premium Cookie Fam genetics doing what they do best.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Limonene", "Caryophyllene", "Linalool"], "effects": ["Relaxing", "Happy", "Euphoric"], "lineage": "Sunset Sherbert x Wedding Pie", "nose": "Cream, vanilla, fresh berries"}'::jsonb),

-- 9. Bolo Candy
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Bolo Candy', 'bolo-candy',
'Straight candy jar fire. Bolo Candy brings that sweet, fruity punch that''s become legendary. Dense, colorful nugs that smell like a candy shop explosion. The high is balanced and smooth - keeps you elevated but functional. This is the type of exotic that photographs perfect and smokes even better. Limited batches, premium quality, this is boutique cannabis at its finest.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Limonene", "Caryophyllene", "Myrcene"], "effects": ["Uplifting", "Happy", "Creative"], "lineage": "Biscotti x Runtz", "nose": "Sweet candy, tropical fruit, cream"}'::jsonb),

-- 10. Pop 41
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Pop 41', 'pop-41',
'Next-level exotic genetics. Pop 41 is that rare phenotype that checks all the boxes - bag appeal, terp profile, and potency. The buds are chunky and absolutely caked in trichomes. Smell is complex: fruity, gassy, with a unique sweetness that''s hard to place. Balanced hybrid that provides a clear-headed, euphoric high. This is the type of flower that makes people stop and ask what you''re smoking.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Caryophyllene", "Limonene", "Humulene"], "effects": ["Euphoric", "Uplifting", "Focused"], "lineage": "Grape Gasoline x Animal Cookies", "nose": "Grape candy, fuel, sweet spice"}'::jsonb),

-- Continue with remaining 40 strains...
-- (Continuing in next values block to keep it readable)

-- 11. Purple Pineapple
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Purple Pineapple', 'purple-pineapple',
'Tropical vibes meets California fire. Purple Pineapple brings vibrant colors and even more vibrant flavors. Deep purple hues mixed with bright green and orange hairs, all under a snowy layer of crystals. The nose is straight pineapple with hints of grape and earth. Sativa-dominant hybrid that energizes and uplifts. Perfect for daytime use when you need that extra boost of creativity and good vibes.',
'approved',
'{"strain_type": "Sativa", "terpene_profile": ["Limonene", "Pinene", "Caryophyllene"], "effects": ["Energizing", "Uplifting", "Happy"], "lineage": "Purple Kush x Pineapple Express", "nose": "Fresh pineapple, grape, tropical fruit"}'::jsonb),

-- 12. Purple Truffle
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Purple Truffle', 'purple-truffle',
'Exotic meets gourmet. Purple Truffle is that rare combination of stunning visuals and complex flavor. Dark purple buds so frosty they look like they''ve been dipped in diamonds. The terp profile is sophisticated - earthy truffle notes with sweet grape undertones. Indica-leaning hybrid that provides deep relaxation while keeping your mind engaged. This is connoisseur-level flower, the type you break out for special occasions.',
'approved',
'{"strain_type": "Indica", "terpene_profile": ["Myrcene", "Caryophyllene", "Limonene"], "effects": ["Relaxing", "Euphoric", "Sleepy"], "lineage": "Purple Punch x White Truffle", "nose": "Earthy truffle, sweet grape, fuel"}'::jsonb),

-- 13. Lip Smackers
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Lip Smackers', 'lip-smackers',
'Flavor so loud it speaks for itself. Lip Smackers is named for a reason - every hit leaves you wanting more. Sweet, fruity terps that taste like mixed berries and cream. The buds are dense, colorful, and sticky as hell. Balanced hybrid that brings euphoria and relaxation in equal measure. This is the type of flower that sells out quick. Pure fire from seed to smoke.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Limonene", "Linalool", "Caryophyllene"], "effects": ["Happy", "Euphoric", "Relaxing"], "lineage": "Zkittlez x Gelato", "nose": "Mixed berries, cream, sweet candy"}'::jsonb),

-- 14. Garlic Breath
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Garlic Breath', 'garlic-breath',
'Not for the faint of heart. Garlic Breath brings that pungent, savory funk that real smokers appreciate. The name ain''t a joke - these buds reek of fresh garlic mixed with diesel fuel and earth. Potent indica-dominant hybrid that hits hard and fast. This is night-time medicine for when you need to shut it down. The flavor is as bold as the smell - savory, gassy, with a sweet finish. Real deal OG smoker''s strain.',
'approved',
'{"strain_type": "Indica", "terpene_profile": ["Caryophyllene", "Myrcene", "Limonene"], "effects": ["Relaxing", "Sleepy", "Euphoric"], "lineage": "GMO x Mendo Breath", "nose": "Pungent garlic, diesel, earthy spice"}'::jsonb),

-- 15. Lemon Bang Bang
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Lemon Bang Bang', 'lemon-bang-bang',
'Wake and bake certified. Lemon Bang Bang is that energizing sativa that starts your day right. Bright green buds with vibrant orange hairs and a lemon zest aroma that fills the room. The flavor is crisp, clean lemon with hints of spice. Perfect for morning coffee sessions or daytime activities. Clear-headed high that boosts creativity and focus. This is functional flower for productive people.',
'approved',
'{"strain_type": "Sativa", "terpene_profile": ["Limonene", "Pinene", "Caryophyllene"], "effects": ["Energizing", "Focused", "Uplifting"], "lineage": "Lemon Tree x Purple Punch", "nose": "Zesty lemon, citrus, pine"}'::jsonb),

-- 16. Super Runtz
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Super Runtz', 'super-runtz',
'The evolution of an icon. Super Runtz takes the legendary Runtz genetics and amplifies everything. Bigger buds, louder terps, stronger effects. These nugs are absolute units - dense, colorful, and dripping in resin. The candy flavor is turned up to 11, with tropical fruit notes that linger on your palate. Perfectly balanced hybrid that delivers euphoria and relaxation. This is exotic royalty.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Caryophyllene", "Limonene", "Linalool"], "effects": ["Euphoric", "Happy", "Relaxing"], "lineage": "Runtz x Zkittlez", "nose": "Tropical candy, sweet fruit, cream"}'::jsonb),

-- 17. Cherry Popper
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Cherry Popper', 'cherry-popper',
'Sweet like cherry pie, hits like a truck. Cherry Popper brings that classic cherry flavor with modern potency. Beautiful buds with deep red and purple hues mixed with bright green. The aroma is intoxicating - ripe cherries with a gassy undertone. Hybrid that leans indica, perfect for evening relaxation without heavy sedation. Smooth smoke, incredible taste, strong effects. This is what premium flower should be.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Myrcene", "Caryophyllene", "Limonene"], "effects": ["Relaxing", "Happy", "Euphoric"], "lineage": "Cherry Pie x GMO", "nose": "Ripe cherry, sweet fuel, earth"}'::jsonb),

-- 18. Fruity Pebbles
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Fruity Pebbles', 'fruity-pebbles',
'Breakfast of champions. Fruity Pebbles is that nostalgic smoke with next-level genetics. The buds are colorful like the cereal - purple, red, orange, and green all wrapped in white crystal. Smell and taste is straight cereal milk with tropical fruit undertones. Balanced hybrid that brings joy and creativity. This is smile-inducing flower that''s perfect for social sessions. Classic strain done right.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Limonene", "Caryophyllene", "Myrcene"], "effects": ["Happy", "Uplifting", "Creative"], "lineage": "Green Ribbon x Granddaddy Purple x Tahoe Alien", "nose": "Fruity cereal, berries, cream"}'::jsonb),

-- 19. Gotti
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Gotti', 'gotti',
'Boss strain for boss smokers. Gotti brings that New York state of mind with West Coast execution. Dense, heavy buds that are rock solid and covered in trichomes. The smell is complex - sweet, gassy, with hints of earth and spice. Potent indica-dominant hybrid that provides deep relaxation. This is end-of-day medicine for when you need to decompress. Strong, consistent, reliable. That''s Gotti.',
'approved',
'{"strain_type": "Indica", "terpene_profile": ["Caryophyllene", "Myrcene", "Humulene"], "effects": ["Relaxing", "Sleepy", "Euphoric"], "lineage": "Afghani x OG Kush", "nose": "Sweet gas, earth, pine"}'::jsonb),

-- 20. Super Lemon Haze
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Super Lemon Haze', 'super-lemon-haze',
'Award-winning genetics that speak for themselves. Super Lemon Haze is that legendary sativa that''s been bringing energy since day one. Bright green buds with yellow tones and a lemon scent so strong it fills the room. The flavor is pure citrus heaven. Energizing, uplifting high that''s perfect for daytime activities. This is motivation in flower form. Classic strain with timeless quality.',
'approved',
'{"strain_type": "Sativa", "terpene_profile": ["Limonene", "Terpinolene", "Caryophyllene"], "effects": ["Energizing", "Uplifting", "Focused"], "lineage": "Lemon Skunk x Super Silver Haze", "nose": "Bright lemon, citrus zest, sweet"}'::jsonb),

-- 21-50 continuing...
('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Cali Candy', 'cali-candy',
'West Coast sweetness at its finest. Cali Candy represents everything great about California cannabis - vibrant colors, loud terps, potent effects. These buds are picture-perfect with purple undertones and a thick coating of trichomes. Sweet, fruity aroma with hints of vanilla. Balanced hybrid that keeps you lifted and focused. This is modern exotic flower that sets the standard.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Limonene", "Caryophyllene", "Linalool"], "effects": ["Uplifting", "Happy", "Creative"], "lineage": "Zkittlez x Gelato 33", "nose": "Sweet candy, vanilla, mixed fruit"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Black Runtz', 'black-runtz',
'The dark horse of the Runtz family. Black Runtz brings that mysterious, exotic vibe with deep purple-black buds under a blanket of frost. The terp profile is unique - sweet candy mixed with dark berries and earth. Potent indica-leaning hybrid that provides strong relaxation. This is premium night-time smoke that helps you unwind. Limited batches, maximum quality.',
'approved',
'{"strain_type": "Indica", "terpene_profile": ["Caryophyllene", "Myrcene", "Limonene"], "effects": ["Relaxing", "Sleepy", "Euphoric"], "lineage": "Zkittlez x Gelato x Black Diamond", "nose": "Dark berries, candy, earth"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Bubble Gum', 'bubble-gum',
'Classic genetics with timeless appeal. Bubble Gum is that old-school favorite done with new-school quality. Pink-tinged buds that smell exactly like fresh bubblegum. Sweet, nostalgic flavor that brings you back. Balanced hybrid that provides a gentle, pleasant high. Perfect for all-day smoking or introducing new smokers to premium flower. This is feel-good cannabis at its best.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Limonene", "Myrcene", "Caryophyllelle"], "effects": ["Happy", "Relaxing", "Uplifting"], "lineage": "Indiana Bubble Gum", "nose": "Sweet bubblegum, berries, sugar"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Blue Zushi', 'blue-zushi',
'Exotic meets elegant. Blue Zushi brings that refined smoke with complex flavor profiles. Deep blue and purple hues with orange pistils and white trichomes create a stunning visual. The aroma is sophisticated - sweet berries, earth, and floral notes. Indica-dominant hybrid that relaxes without sedating. This is boutique cannabis for the refined palate. Limited availability, premium quality.',
'approved',
'{"strain_type": "Indica", "terpene_profile": ["Myrcene", "Caryophyllene", "Linalool"], "effects": ["Relaxing", "Euphoric", "Happy"], "lineage": "Zkittlez x Kush Mints", "nose": "Blueberry, earth, floral"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Candy Runtz', 'candy-runtz',
'Sugar-coated perfection. Candy Runtz amplifies the sweetness factor to maximum levels. Colorful buds that look like candy and taste even better. Loud tropical fruit terps with a sugary finish. Balanced hybrid that brings happiness and relaxation. This is the type of exotic that photographs perfect and smokes cleaner. Premium genetics, premium results.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Limonene", "Caryophyllene", "Linalool"], "effects": ["Happy", "Uplifting", "Relaxing"], "lineage": "Runtz x Candy Apple", "nose": "Tropical candy, sugar, sweet fruit"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Chicago Runtz', 'chicago-runtz',
'Midwest exotic with that Chicago edge. Chicago Runtz brings the candy flavor with added punch. Dense, frosty buds that hit harder than your average Runtz. Sweet terps with a gassy backbone. Potent hybrid that provides strong effects while keeping you functional. This is premium smoke for serious smokers. No games, just quality.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Caryophyllene", "Limonene", "Myrcene"], "effects": ["Euphoric", "Relaxing", "Happy"], "lineage": "Runtz x Chicago OG", "nose": "Sweet candy, fuel, earth"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Detroit Runtz', 'detroit-runtz',
'Motor City fire with Runtz genetics. Detroit Runtz combines that candy sweetness with a harder, gassier edge. Rock-hard nugs covered in crystal that reek of fruit and fuel. Potent hybrid that delivers strong, long-lasting effects. This is that knock-out exotic that stands out in any lineup. Real exotic heads know what''s up.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Caryophyllene", "Limonene", "Humulene"], "effects": ["Relaxing", "Euphoric", "Sleepy"], "lineage": "Runtz x Detroit OG", "nose": "Sweet fruit, diesel, spice"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Gary Payton', 'gary-payton',
'Hall of Fame genetics. Gary Payton is that championship-level smoke named after the legend himself. Potent, loud, and consistent - just like The Glove''s defense. Dense buds with a complex aroma of diesel, fruit, and earth. Powerful hybrid that hits fast and lasts long. This is top-tier Cookie Fam genetics showing why they''re the best in the game.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Caryophyllene", "Limonene", "Linalool"], "effects": ["Euphoric", "Uplifting", "Relaxing"], "lineage": "The Y x Snowman", "nose": "Diesel fuel, sweet fruit, earth"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Gelato Gas', 'gelato-gas',
'The perfect marriage. Gelato Gas combines sweet dessert flavors with that loud fuel funk. Beautiful purple and green buds absolutely caked in trichomes. The nose is incredible - creamy gelato sweetness hits first, followed by strong gas. Balanced hybrid that provides euphoria and relaxation. This is refined exotic fire for the discerning smoker.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Caryophyllene", "Limonene", "Myrcene"], "effects": ["Euphoric", "Relaxing", "Happy"], "lineage": "Gelato 41 x Gas", "nose": "Creamy gelato, diesel fuel, sweet"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'G33', 'g33',
'Next-generation Gelato. G33 is a rare phenotype that showcases the best of what Gelato genetics can be. Bright purple buds under a thick frost layer. Sweet berry and cream terps with hints of gas. Smooth hybrid high that''s perfect for any time of day. This is boutique flower that represents the evolution of West Coast cannabis.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Limonene", "Caryophyllene", "Linalool"], "effects": ["Uplifting", "Happy", "Relaxing"], "lineage": "Gelato phenotype", "nose": "Sweet berries, cream, citrus"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Ice Cream Cookie', 'ice-cream-cookie',
'Dessert menu exclusive. Ice Cream Cookie brings that sweet, creamy flavor with Cookie genetics backing it up. Frosty buds that look like they''ve been dipped in vanilla ice cream. The taste is smooth and sweet with a slight earthy finish. Balanced hybrid perfect for daytime or evening sessions. This is feel-good flower that tastes as good as it looks.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Limonene", "Caryophyllene", "Myrcene"], "effects": ["Happy", "Relaxing", "Uplifting"], "lineage": "Gelato x Wedding Cake", "nose": "Vanilla cream, sweet cookies, earth"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Japanese Peaches', 'japanese-peaches',
'Exotic fruit meets exotic flower. Japanese Peaches brings that unique peach aroma with premium potency. Beautiful light green and orange buds covered in crystal. The flavor is delicate yet distinct - ripe peaches with floral undertones. Sativa-leaning hybrid that uplifts and energizes. This is refined cannabis for those who appreciate unique terp profiles.',
'approved',
'{"strain_type": "Sativa", "terpene_profile": ["Limonene", "Linalool", "Myrcene"], "effects": ["Uplifting", "Happy", "Creative"], "lineage": "Peach Rings x Lemon Tree", "nose": "Fresh peaches, floral, sweet"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Lava Cake', 'lava-cake',
'Decadent and potent. Lava Cake is that rich, dessert smoke with serious power. Dark purple and green buds that are dense and sticky. The aroma is sweet chocolate and mint with earthy undertones. Indica-dominant hybrid that provides deep, relaxing effects. This is night-time medicine that helps you decompress and unwind. Premium genetics, premium effects.',
'approved',
'{"strain_type": "Indica", "terpene_profile": ["Caryophyllene", "Limonene", "Myrcene"], "effects": ["Relaxing", "Sleepy", "Euphoric"], "lineage": "Thin Mint Cookies x Grape Pie", "nose": "Chocolate mint, sweet earth, grape"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'LV Candy', 'lv-candy',
'Luxury sweet shop. LV Candy brings that high-end exotic vibe with candy terps and premium bag appeal. Colorful buds under a thick layer of trichomes. Sweet, fruity aroma with hints of vanilla and cream. Balanced hybrid that provides a smooth, enjoyable high. This is boutique flower for those who demand the best.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Limonene", "Caryophyllene", "Linalool"], "effects": ["Happy", "Euphoric", "Relaxing"], "lineage": "Las Vegas OG x Runtz", "nose": "Sweet candy, vanilla, cream"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Perm Marker', 'perm-marker',
'Bold and unforgettable. Permanent Marker lives up to the name with a smell so strong it leaves an impression. Pungent, gassy aroma with hints of floral and spice. Dense buds covered in resin that stick to everything. Potent hybrid that delivers strong, long-lasting effects. This is loud exotic for experienced smokers who appreciate bold flavors.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Limonene", "Caryophyllene", "Linalool"], "effects": ["Relaxing", "Euphoric", "Happy"], "lineage": "Biscotti x Sherb x Jealousy", "nose": "Pungent gas, floral, chemical sweetness"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Pink Lady', 'pink-lady',
'Elegant and powerful. Pink Lady brings beautiful pink and purple hues with potent effects. Sweet floral aroma with berry undertones. Smooth, flavorful smoke that''s easy on the lungs. Indica-leaning hybrid perfect for evening relaxation. This is refined flower that combines beauty with strength.',
'approved',
'{"strain_type": "Indica", "terpene_profile": ["Myrcene", "Linalool", "Caryophyllene"], "effects": ["Relaxing", "Happy", "Sleepy"], "lineage": "Pink Kush x Cherry Pie", "nose": "Sweet berries, floral, earth"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Pink Velvet', 'pink-velvet',
'Smooth as the name suggests. Pink Velvet is that luxurious smoke with silky smooth flavor. Vibrant pink and purple buds that are soft to the touch but packed with power. Sweet, floral aroma with hints of vanilla. Balanced hybrid that provides relaxation without heavy sedation. Premium flower for those who appreciate refined cannabis.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Linalool", "Caryophyllene", "Limonene"], "effects": ["Relaxing", "Euphoric", "Happy"], "lineage": "Pink Kush x Velvet Bud", "nose": "Sweet florals, vanilla, berry"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Private Reserve', 'private-reserve',
'The vault exclusive. Private Reserve is that special batch saved for the most discerning customers. Hand-selected phenotype with perfect structure, trichome coverage, and terp profile. Complex aroma of OG funk, sweet earth, and pine. Potent indica-dominant hybrid that provides therapeutic relaxation. This is top-shelf medicine that represents the pinnacle of cultivation.',
'approved',
'{"strain_type": "Indica", "terpene_profile": ["Myrcene", "Caryophyllene", "Pinene"], "effects": ["Relaxing", "Sleepy", "Euphoric"], "lineage": "Private Reserve OG phenotype", "nose": "OG funk, pine, sweet earth"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Project Z', 'project-z',
'The experimental masterpiece. Project Z represents the cutting edge of cannabis breeding. Unique terp profile that''s hard to categorize - fruity, gassy, earthy all at once. Dense, colorful buds that photograph perfect. Balanced hybrid with strong, complex effects. This is next-level exotic that pushes boundaries.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Limonene", "Caryophyllene", "Myrcene"], "effects": ["Euphoric", "Creative", "Uplifting"], "lineage": "Zkittlez x Project 4516", "nose": "Mixed fruit, gas, earth"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Purple Slushie', 'purple-slushie',
'Frozen treat vibes. Purple Slushie brings that icy sweet flavor with beautiful purple coloration. Frosty buds that look like they''ve been kept in the freezer. Sweet grape and berry aroma with a refreshing finish. Indica-leaning hybrid perfect for evening chill sessions. This is feel-good flower that tastes incredible.',
'approved',
'{"strain_type": "Indica", "terpene_profile": ["Myrcene", "Caryophyllene", "Limonene"], "effects": ["Relaxing", "Happy", "Sleepy"], "lineage": "Purple Punch x Slurricane", "nose": "Grape slushie, sweet berries, cream"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Sherb Pie', 'sherb-pie',
'Dessert cart essential. Sherb Pie combines the best of Sherbert and Pie genetics. Sweet, creamy flavor with hints of fresh berries. Beautiful purple and green buds under heavy frost. Balanced hybrid that provides smooth, enjoyable effects. This is quality Cookie Fam genetics showing why they''re industry leaders.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Caryophyllene", "Limonene", "Linalool"], "effects": ["Relaxing", "Happy", "Euphoric"], "lineage": "Sunset Sherbert x Cherry Pie", "nose": "Sweet cream, berries, vanilla"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Snoop Runtz', 'snoop-runtz',
'The Doggfather approved. Snoop Runtz brings that West Coast legend''s name to the Runtz family. Premium candy terps with added funk. Dense, colorful nugs that photograph perfect. Smooth hybrid effects that keep you lifted but functional. This is celebrity exotic done right - all quality, no gimmicks.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Limonene", "Caryophyllene", "Myrcene"], "effects": ["Happy", "Relaxing", "Uplifting"], "lineage": "Runtz x Snoop''s Dream", "nose": "Sweet candy, tropical fruit, gas"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Ghost Rider', 'ghost-rider',
'Hauntingly good. Ghost Rider brings that ethereal smoke with serious potency. Pale green buds so frosty they look ghostly white. The aroma is complex - pine, lemon, and earth with a mysterious sweetness. Potent hybrid that provides strong mental and physical effects. This is exotic flower that stands out in any collection.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Pinene", "Limonene", "Caryophyllene"], "effects": ["Euphoric", "Uplifting", "Relaxing"], "lineage": "Ghost OG x Hellfire OG", "nose": "Pine, lemon zest, sweet earth"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Alpha Runtz', 'alpha-runtz',
'The alpha of the pack. Alpha Runtz takes Runtz genetics and turns them up. Bigger structure, louder terps, stronger effects. Colorful buds with maximum trichome coverage. Sweet candy aroma that''s impossible to miss. Potent hybrid that delivers on all fronts. This is premium exotic that sets the standard.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Caryophyllene", "Limonene", "Linalool"], "effects": ["Euphoric", "Happy", "Relaxing"], "lineage": "Runtz x Alpha OG", "nose": "Sweet candy, tropical fruit, fuel"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Runtz', 'runtz',
'The original that started it all. Runtz is the legendary strain that created a whole movement. Sweet candy terps, beautiful bag appeal, potent effects. Colorful buds with perfect structure and heavy frost. Balanced hybrid that''s become the gold standard for exotic flower. This is classic genetics that never go out of style.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Caryophyllene", "Limonene", "Linalool"], "effects": ["Euphoric", "Happy", "Relaxing"], "lineage": "Zkittlez x Gelato", "nose": "Sweet candy, tropical fruit, cream"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Diamond', 'diamond',
'Clarity and brilliance. Diamond is named for its sparkling appearance and premium quality. Heavily frosted buds that shine under light. Clean, pure flavor profile with hints of pine and citrus. Sativa-leaning hybrid that provides clear-headed, energizing effects. This is refined flower for daytime productivity.',
'approved',
'{"strain_type": "Sativa", "terpene_profile": ["Pinene", "Limonene", "Caryophyllene"], "effects": ["Energizing", "Focused", "Uplifting"], "lineage": "Rare Dankness selection", "nose": "Pine, citrus, clean earth"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'101 Runtz', 'runtz-101',
'The education. 101 Runtz teaches you what real exotic should be. Premium Runtz phenotype with textbook characteristics. Perfect structure, ideal trichome coverage, loud candy terps. Balanced effects that satisfy both mind and body. This is what you show people when they ask what makes flower exotic.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Limonene", "Caryophyllene", "Linalool"], "effects": ["Happy", "Euphoric", "Relaxing"], "lineage": "Runtz phenotype", "nose": "Sweet candy, fruit punch, cream"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'LCG', 'lcg',
'London Cake Gas. LCG represents the international wave of exotic cannabis. Dense, frosty buds with a complex aroma of cake batter and fuel. Potent hybrid that delivers smooth, long-lasting effects. This is refined exotic that showcases modern breeding at its finest. Limited batches, maximum quality.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Caryophyllene", "Limonene", "Myrcene"], "effects": ["Euphoric", "Relaxing", "Happy"], "lineage": "London Pound Cake x Gas", "nose": "Sweet cake, diesel fuel, vanilla"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Glitter Bomb', 'glitter-bomb',
'Explosive sparkle. Glitter Bomb is covered in so much crystal it looks like it''s been rolled in glitter. Sweet, fruity aroma with hints of spice. Dense buds that are sticky to the touch. Potent hybrid that provides strong euphoric effects. This is show-stopping flower that''s as potent as it is beautiful.',
'approved',
'{"strain_type": "Hybrid", "terpene_profile": ["Limonene", "Caryophyllene", "Linalool"], "effects": ["Euphoric", "Uplifting", "Happy"], "lineage": "Grape Gas x OG Eddy Lepp", "nose": "Sweet grape, spice, floral"}'::jsonb),

('cd2e1122-d511-4edb-be5d-98ef274b4baf', '296c87ce-a31b-43a3-b48f-52902134a723',
'Jet Fuel', 'jet-fuel',
'High-octane medicine. Jet Fuel brings that loud diesel aroma with serious potency. Dark green buds covered in crystal that reek of fuel and earth. Sativa-dominant hybrid that provides energizing, uplifting effects. This is wake-and-bake certified flower for those who need to stay productive. Strong, consistent, reliable.',
'approved',
'{"strain_type": "Sativa", "terpene_profile": ["Caryophyllene", "Limonene", "Humulene"], "effects": ["Energizing", "Focused", "Uplifting"], "lineage": "Aspen OG x High Country Diesel", "nose": "Pungent diesel, pine, sweet earth"}'::jsonb);

-- Now assign Top Shelf pricing to all products
INSERT INTO product_pricing_assignments (product_id, blueprint_id, price_break_slug, price)
SELECT
  p.id,
  'f408beb5-8ccf-45dd-9d98-6321d3d7fab7', -- Top Shelf Blueprint
  '1g',
  15.00
FROM products p
WHERE p.vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
  AND p.category_id = '296c87ce-a31b-43a3-b48f-52902134a723'
  AND p.name IN (
    'Marshmallow Mountain', 'Gelato 15', 'Sub Zero', 'White Truffle', 'Dixie Dust',
    'Pink Runtz', 'Lemon Cherry Diesel', 'Sherb Cream Pie', 'Bolo Candy', 'Pop 41',
    'Purple Pineapple', 'Purple Truffle', 'Lip Smackers', 'Garlic Breath', 'Lemon Bang Bang',
    'Super Runtz', 'Cherry Popper', 'Fruity Pebbles', 'Gotti', 'Super Lemon Haze',
    'Cali Candy', 'Black Runtz', 'Bubble Gum', 'Blue Zushi', 'Candy Runtz',
    'Chicago Runtz', 'Detroit Runtz', 'Gary Payton', 'Gelato Gas', 'G33',
    'Ice Cream Cookie', 'Japanese Peaches', 'Lava Cake', 'LV Candy', 'Perm Marker',
    'Pink Lady', 'Pink Velvet', 'Private Reserve', 'Project Z', 'Purple Slushie',
    'Sherb Pie', 'Snoop Runtz', 'Ghost Rider', 'Alpha Runtz', 'Runtz',
    'Diamond', '101 Runtz', 'LCG', 'Glitter Bomb', 'Jet Fuel'
  );

-- Add more price breaks for each product (3.5g, 7g, 14g, 28g)
INSERT INTO product_pricing_assignments (product_id, blueprint_id, price_break_slug, price)
SELECT
  p.id,
  'f408beb5-8ccf-45dd-9d98-6321d3d7fab7',
  '3.5g',
  45.00
FROM products p
WHERE p.vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
  AND p.category_id = '296c87ce-a31b-43a3-b48f-52902134a723'
UNION ALL
SELECT
  p.id,
  'f408beb5-8ccf-45dd-9d98-6321d3d7fab7',
  '7g',
  80.00
FROM products p
WHERE p.vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
  AND p.category_id = '296c87ce-a31b-43a3-b48f-52902134a723'
UNION ALL
SELECT
  p.id,
  'f408beb5-8ccf-45dd-9d98-6321d3d7fab7',
  '14g',
  150.00
FROM products p
WHERE p.vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
  AND p.category_id = '296c87ce-a31b-43a3-b48f-52902134a723'
UNION ALL
SELECT
  p.id,
  'f408beb5-8ccf-45dd-9d98-6321d3d7fab7',
  '28g',
  280.00
FROM products p
WHERE p.vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
  AND p.category_id = '296c87ce-a31b-43a3-b48f-52902134a723';

-- Verification
SELECT COUNT(*) as total_products_added
FROM products
WHERE vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
  AND category_id = '296c87ce-a31b-43a3-b48f-52902134a723';
