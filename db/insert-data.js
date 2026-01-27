const query = `
-- Insert 10 users
INSERT INTO users (username, password, friend_code, is_online) VALUES
('alice123', 'hashed_password_1', 'ALICE123', true),
('bobsmith', 'hashed_password_2', 'BOBSMITH', false),
('charlie99', 'hashed_password_3', 'CHARLIE9', true),
('diana_r', 'hashed_password_4', 'DIANAR', false),
('evan_tech', 'hashed_password_5', 'EVANTECH', true),
('fiona_g', 'hashed_password_6', 'FIONAG', true),
('george_m', 'hashed_password_7', 'GEORGEM', false),
('hannah_b', 'hashed_password_8', 'HANNAHB', true),
('ian_coder', 'hashed_password_9', 'IANCODER', false),
('julia_d', 'hashed_password_10', 'JULIAD', true);

-- Insert user profiles
INSERT INTO profiles (user_id, public_name, description) VALUES
(1, 'Alice Johnson', 'Software developer and cat lover'),
(2, 'Bob Smith', 'Digital artist and gamer'),
(3, 'Charlie Brown', 'Student and football enthusiast'),
(4, 'Diana Ross', 'Musician and traveler'),
(5, 'Evan Chen', 'Tech entrepreneur'),
(6, 'Fiona Green', 'Photographer and blogger'),
(7, 'George Miller', 'Chef and food critic'),
(8, 'Hannah Baker', 'Bookworm and writer'),
(9, 'Ian Taylor', 'AI researcher and data scientist'),
(10, 'Julia Davis', 'Yoga instructor and wellness coach');

-- Insert friends relationships (bidirectional, but stored with uid1 < uid2)
INSERT INTO friends (uid1, uid2) VALUES
(1, 2),  -- Alice and Bob
(1, 3),  -- Alice and Charlie
(1, 5),  -- Alice and Evan
(2, 3),  -- Bob and Charlie
(2, 6),  -- Bob and Fiona
(3, 4),  -- Charlie and Diana
(4, 5),  -- Diana and Evan
(5, 6),  -- Evan and Fiona
(6, 7),  -- Fiona and George
(7, 8),  -- George and Hannah
(8, 9),  -- Hannah and Ian
(9, 10), -- Ian and Julia
(1, 10), -- Alice and Julia
(3, 8);  -- Charlie and Hannah

-- Insert private messages
INSERT INTO private_messages (sender_user_id, receiver_user_id, created_at, body) VALUES
-- Alice and Bob conversation
(1, 2, '2024-01-15 10:30:00', 'Hey Bob, how are you?'),
(2, 1, '2024-01-15 10:32:00', 'I''m good Alice! Working on some new art.'),
(1, 2, '2024-01-15 10:35:00', 'Cool! Can I see it when you''re done?'),

-- Alice and Charlie conversation
(1, 3, '2024-01-16 14:20:00', 'Charlie, are we still meeting for lunch?'),
(3, 1, '2024-01-16 14:25:00', 'Yes! 12:30 at the usual place'),

-- Diana and Evan conversation
(4, 5, '2024-01-17 09:15:00', 'Evan, I need tech advice for my studio'),
(5, 4, '2024-01-17 09:20:00', 'Sure Diana, let''s schedule a call'),
(4, 5, '2024-01-17 09:22:00', 'How about tomorrow at 3 PM?'),

-- Fiona and George conversation
(6, 7, '2024-01-18 19:45:00', 'George, the food at your restaurant was amazing!'),
(7, 6, '2024-01-18 19:50:00', 'Thanks Fiona! So glad you enjoyed it'),

-- Hannah and Ian conversation
(8, 9, '2024-01-19 11:10:00', 'Ian, can you recommend some AI books?'),
(9, 8, '2024-01-19 11:15:00', 'Of course! Let me send you a list'),

-- Multiple messages between various users
(10, 1, '2024-01-20 08:00:00', 'Alice, ready for our morning yoga session?'),
(3, 8, '2024-01-20 16:30:00', 'Hannah, have you read the new mystery novel?');

-- Insert groups
INSERT INTO groups (name, description) VALUES
('Tech Enthusiasts', 'For all things technology and programming'),
('Food Lovers', 'Share recipes and restaurant recommendations'),
('Book Club', 'Monthly book discussions and recommendations'),
('Gaming Guild', 'Video game discussions and multiplayer sessions'),
('Fitness Community', 'Workout tips and motivation'),
('Music Makers', 'For musicians and music producers');

-- Insert users into groups with some owners
INSERT INTO users_groups (user_id, group_id, is_owner) VALUES
-- Tech Enthusiasts (group 1)
(1, 1, true),   -- Alice is owner
(5, 1, false),  -- Evan
(9, 1, false),  -- Ian
(2, 1, false),  -- Bob

-- Food Lovers (group 2)
(7, 2, true),   -- George is owner
(4, 2, false),  -- Diana
(6, 2, false),  -- Fiona
(1, 2, false),  -- Alice

-- Book Club (group 3)
(8, 3, true),   -- Hannah is owner
(10, 3, false), -- Julia
(3, 3, false),  -- Charlie

-- Gaming Guild (group 4)
(2, 4, true),   -- Bob is owner
(3, 4, false),  -- Charlie
(5, 4, false),  -- Evan

-- Fitness Community (group 5)
(10, 5, true),  -- Julia is owner
(1, 5, false),  -- Alice
(4, 5, false),  -- Diana
(6, 5, false),  -- Fiona

-- Music Makers (group 6)
(4, 6, true),   -- Diana is owner
(7, 6, false),  -- George
(2, 6, false);  -- Bob

-- Now insert group messages
INSERT INTO group_messages (sender_user_id, group_id, created_at, body) VALUES
-- Tech Enthusiasts messages
(1, 1, '2024-01-15 09:00:00', 'Welcome to Tech Enthusiasts!'),
(5, 1, '2024-01-15 09:05:00', 'Thanks for creating this group, Alice!'),
(9, 1, '2024-01-15 09:10:00', 'Anyone working on any interesting projects?'),

-- Food Lovers messages
(7, 2, '2024-01-16 12:00:00', 'New recipe alert: Spicy garlic pasta!'),
(4, 2, '2024-01-16 12:05:00', 'Sounds delicious, George!'),
(6, 2, '2024-01-16 12:10:00', 'Can you share the recipe?'),

-- Book Club messages
(8, 3, '2024-01-17 18:00:00', 'This month''s book is "Project Hail Mary"'),
(10, 3, '2024-01-17 18:05:00', 'Great choice! I loved that book'),
(3, 3, '2024-01-17 18:10:00', 'When is the discussion?'),

-- Gaming Guild messages
(2, 4, '2024-01-18 20:00:00', 'Anyone up for some multiplayer tonight?'),
(3, 4, '2024-01-18 20:05:00', 'I''m in! What game?'),
(5, 4, '2024-01-18 20:10:00', 'I can join after 9 PM'),

-- Fitness Community messages
(10, 5, '2024-01-19 07:00:00', 'Morning workout complete! Who else exercised today?'),
(1, 5, '2024-01-19 07:05:00', 'Just finished my yoga session!'),
(4, 5, '2024-01-19 07:10:00', 'Going for a run now'),

-- Music Makers messages
(4, 6, '2024-01-20 14:00:00', 'Working on a new song, anyone want to collaborate?'),
(7, 6, '2024-01-20 14:05:00', 'I play guitar, what genre?'),
(2, 6, '2024-01-20 14:10:00', 'I can help with production');
`;

async function insertData(client) {
  await client.query(query);
}

module.exports = { insertData };
