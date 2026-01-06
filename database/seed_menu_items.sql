-- Seed data for menu_items
-- Run this after init.sql to populate menu items

-- Appetizers (10 items)
INSERT INTO menu_items (name, description, price, category_id, is_available) VALUES
('Garlic Bread', 'Toasted bread with garlic butter and herbs', 5.90, (SELECT id FROM menu_categories WHERE name = 'Appetizers'), true),
('Chicken Wings', 'Crispy fried chicken wings with BBQ sauce', 12.90, (SELECT id FROM menu_categories WHERE name = 'Appetizers'), true),
('Mozzarella Sticks', 'Deep-fried mozzarella with marinara dipping sauce', 9.90, (SELECT id FROM menu_categories WHERE name = 'Appetizers'), true),
('Onion Rings', 'Crispy battered onion rings with ranch dip', 7.90, (SELECT id FROM menu_categories WHERE name = 'Appetizers'), true),
('Caesar Salad', 'Romaine lettuce with Caesar dressing, croutons and parmesan', 11.90, (SELECT id FROM menu_categories WHERE name = 'Appetizers'), true),
('Soup of the Day', 'Ask your server for today''s special soup', 8.90, (SELECT id FROM menu_categories WHERE name = 'Appetizers'), true),
('Bruschetta', 'Toasted bread topped with tomatoes, basil and olive oil', 8.90, (SELECT id FROM menu_categories WHERE name = 'Appetizers'), true),
('Loaded Nachos', 'Tortilla chips with cheese, jalapeños, salsa and sour cream', 14.90, (SELECT id FROM menu_categories WHERE name = 'Appetizers'), true),
('Calamari', 'Crispy fried squid rings with tartar sauce', 15.90, (SELECT id FROM menu_categories WHERE name = 'Appetizers'), true),
('Spring Rolls', 'Crispy vegetable spring rolls with sweet chili sauce', 8.90, (SELECT id FROM menu_categories WHERE name = 'Appetizers'), true),
('Potato Skins', 'Loaded potato skins with bacon, cheese and sour cream', 10.90, (SELECT id FROM menu_categories WHERE name = 'Appetizers'), true),
('Mushroom Soup', 'Creamy mushroom soup served with bread', 9.90, (SELECT id FROM menu_categories WHERE name = 'Appetizers'), true);

-- Main Course (15 items)
INSERT INTO menu_items (name, description, price, category_id, is_available) VALUES
('Grilled Ribeye Steak', '300g premium ribeye steak with your choice of sauce', 45.90, (SELECT id FROM menu_categories WHERE name = 'Main Course'), true),
('Grilled Sirloin Steak', '250g sirloin steak served with vegetables', 38.90, (SELECT id FROM menu_categories WHERE name = 'Main Course'), true),
('Fish and Chips', 'Beer-battered fish fillet with fries and tartar sauce', 24.90, (SELECT id FROM menu_categories WHERE name = 'Main Course'), true),
('Grilled Salmon', 'Atlantic salmon fillet with lemon butter sauce', 32.90, (SELECT id FROM menu_categories WHERE name = 'Main Course'), true),
('Chicken Chop', 'Grilled chicken thigh with black pepper sauce', 22.90, (SELECT id FROM menu_categories WHERE name = 'Main Course'), true),
('Lamb Chop', 'Grilled lamb chops with rosemary and mint sauce', 42.90, (SELECT id FROM menu_categories WHERE name = 'Main Course'), true),
('Spaghetti Bolognese', 'Classic spaghetti with rich meat sauce', 18.90, (SELECT id FROM menu_categories WHERE name = 'Main Course'), true),
('Spaghetti Carbonara', 'Creamy pasta with bacon and parmesan', 19.90, (SELECT id FROM menu_categories WHERE name = 'Main Course'), true),
('Chicken Alfredo', 'Fettuccine with grilled chicken in creamy alfredo sauce', 21.90, (SELECT id FROM menu_categories WHERE name = 'Main Course'), true),
('BBQ Pork Ribs', 'Slow-cooked pork ribs with smoky BBQ glaze', 35.90, (SELECT id FROM menu_categories WHERE name = 'Main Course'), true),
('Beef Burger', 'Juicy beef patty with cheese, lettuce and tomato', 19.90, (SELECT id FROM menu_categories WHERE name = 'Main Course'), true),
('Chicken Burger', 'Crispy chicken fillet burger with special sauce', 17.90, (SELECT id FROM menu_categories WHERE name = 'Main Course'), true),
('Mushroom Risotto', 'Creamy Italian rice with mixed mushrooms', 20.90, (SELECT id FROM menu_categories WHERE name = 'Main Course'), true),
('Grilled Pork Chop', 'Tender pork chop with apple sauce', 25.90, (SELECT id FROM menu_categories WHERE name = 'Main Course'), true),
('Seafood Platter', 'Assorted grilled seafood with garlic butter', 48.90, (SELECT id FROM menu_categories WHERE name = 'Main Course'), true);

-- Beverages (12 items)
INSERT INTO menu_items (name, description, price, category_id, is_available) VALUES
('Coca-Cola', 'Classic Coca-Cola', 4.50, (SELECT id FROM menu_categories WHERE name = 'Beverages'), true),
('Sprite', 'Lemon-lime soda', 4.50, (SELECT id FROM menu_categories WHERE name = 'Beverages'), true),
('Iced Lemon Tea', 'Refreshing iced tea with lemon', 5.90, (SELECT id FROM menu_categories WHERE name = 'Beverages'), true),
('Fresh Orange Juice', 'Freshly squeezed orange juice', 8.90, (SELECT id FROM menu_categories WHERE name = 'Beverages'), true),
('Apple Juice', 'Fresh apple juice', 7.90, (SELECT id FROM menu_categories WHERE name = 'Beverages'), true),
('Mineral Water', 'Still mineral water', 3.50, (SELECT id FROM menu_categories WHERE name = 'Beverages'), true),
('Sparkling Water', 'Carbonated mineral water', 4.50, (SELECT id FROM menu_categories WHERE name = 'Beverages'), true),
('Hot Coffee', 'Freshly brewed coffee', 5.90, (SELECT id FROM menu_categories WHERE name = 'Beverages'), true),
('Iced Coffee', 'Chilled coffee with milk', 7.90, (SELECT id FROM menu_categories WHERE name = 'Beverages'), true),
('Hot Tea', 'Selection of premium teas', 4.90, (SELECT id FROM menu_categories WHERE name = 'Beverages'), true),
('Milkshake', 'Chocolate, vanilla or strawberry', 9.90, (SELECT id FROM menu_categories WHERE name = 'Beverages'), true),
('Lemonade', 'Fresh homemade lemonade', 6.90, (SELECT id FROM menu_categories WHERE name = 'Beverages'), true);

-- Desserts (10 items)
INSERT INTO menu_items (name, description, price, category_id, is_available) VALUES
('Chocolate Lava Cake', 'Warm chocolate cake with molten center and ice cream', 14.90, (SELECT id FROM menu_categories WHERE name = 'Desserts'), true),
('New York Cheesecake', 'Classic creamy cheesecake with berry compote', 12.90, (SELECT id FROM menu_categories WHERE name = 'Desserts'), true),
('Tiramisu', 'Italian coffee-flavored layered dessert', 13.90, (SELECT id FROM menu_categories WHERE name = 'Desserts'), true),
('Apple Pie', 'Warm apple pie with vanilla ice cream', 11.90, (SELECT id FROM menu_categories WHERE name = 'Desserts'), true),
('Brownie Sundae', 'Chocolate brownie with ice cream and chocolate sauce', 12.90, (SELECT id FROM menu_categories WHERE name = 'Desserts'), true),
('Ice Cream', 'Three scoops of your choice - vanilla, chocolate or strawberry', 8.90, (SELECT id FROM menu_categories WHERE name = 'Desserts'), true),
('Crème Brûlée', 'Classic French vanilla custard with caramelized sugar', 13.90, (SELECT id FROM menu_categories WHERE name = 'Desserts'), true),
('Panna Cotta', 'Italian cream dessert with berry sauce', 11.90, (SELECT id FROM menu_categories WHERE name = 'Desserts'), true),
('Churros', 'Fried dough sticks with chocolate dipping sauce', 9.90, (SELECT id FROM menu_categories WHERE name = 'Desserts'), true),
('Banana Split', 'Classic banana split with ice cream and toppings', 12.90, (SELECT id FROM menu_categories WHERE name = 'Desserts'), true);

-- Sides (10 items)
INSERT INTO menu_items (name, description, price, category_id, is_available) VALUES
('French Fries', 'Crispy golden fries', 6.90, (SELECT id FROM menu_categories WHERE name = 'Sides'), true),
('Sweet Potato Fries', 'Crispy sweet potato fries', 8.90, (SELECT id FROM menu_categories WHERE name = 'Sides'), true),
('Mashed Potatoes', 'Creamy mashed potatoes with gravy', 7.90, (SELECT id FROM menu_categories WHERE name = 'Sides'), true),
('Coleslaw', 'Fresh creamy coleslaw', 5.90, (SELECT id FROM menu_categories WHERE name = 'Sides'), true),
('Grilled Vegetables', 'Seasonal grilled vegetables', 8.90, (SELECT id FROM menu_categories WHERE name = 'Sides'), true),
('Corn on the Cob', 'Buttered corn on the cob', 5.90, (SELECT id FROM menu_categories WHERE name = 'Sides'), true),
('Garden Salad', 'Fresh mixed greens with dressing', 7.90, (SELECT id FROM menu_categories WHERE name = 'Sides'), true),
('Baked Potato', 'Baked potato with butter and sour cream', 6.90, (SELECT id FROM menu_categories WHERE name = 'Sides'), true),
('Steamed Rice', 'Plain steamed white rice', 4.90, (SELECT id FROM menu_categories WHERE name = 'Sides'), true),
('Garlic Butter Mushrooms', 'Sautéed mushrooms in garlic butter', 8.90, (SELECT id FROM menu_categories WHERE name = 'Sides'), true);

