
CREATE DATABASE sooda;

CREATE TABLE users(
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255),
    password VARCHAR(255),
    email VARCHAR(255),
    display_name VARCHAR(255),
    created_at DATE DEFAULT CURRENT_DATE,
    active BOOLEAN
);

CREATE TABLE user_friends(
    user_friend_id SERIAL PRIMARY KEY,
    user_id INTEGER,
    friend_id INTEGER,
    blocked BOOLEAN,
    display_name VARCHAR(255)
);

CREATE TABLE chats(
    chat_id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    created_at DATE DEFAULT CURRENT_DATE
);

CREATE TABLE messages(
    message_id SERIAL PRIMARY KEY,
    content VARCHAR(255),
    created_at DATE DEFAULT CURRENT_DATE,
    username VARCHAR(255),
    chat_id INTEGER
);

CREATE TABLE user_chats(
    user_chat_id SERIAL PRIMARY KEY,
    user_id INTEGER,
    chat_id INTEGER
);