
CREATE DATABASE sooda;

CREATE TABLE users(
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(32),
    password VARCHAR(80),
    email VARCHAR(255),
    display_name VARCHAR(32),
    created_at DATE DEFAULT CURRENT_DATE,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE user_friends(
    user_friend_id SERIAL PRIMARY KEY,
    user_id INTEGER,
    friend_id INTEGER,
    blocked BOOLEAN DEFAULT FALSE,
    display_name VARCHAR(32)
);

CREATE TABLE chats(
    chat_id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    created_at DATE DEFAULT CURRENT_DATE
);

CREATE TABLE messages(
    message_id SERIAL PRIMARY KEY,
    content VARCHAR(25000),
    created_at DATE DEFAULT CURRENT_DATE,
    username VARCHAR(32),
    chat_id INTEGER
);

CREATE TABLE user_chats(
    user_chat_id SERIAL PRIMARY KEY,
    user_id INTEGER,
    chat_id INTEGER
);

CREATE TABLE comments(
    comment_id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    content VARCHAR(25000),
    created_at DATE DEFAULT CURRENT_DATE
);