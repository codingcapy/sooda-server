

import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "./connect";

const saltRounds = 6

export interface IDecodedUser {
    userId: number
};

export async function validateUser(req: Request, res: Response) {
    const { username, password } = req.body;
    try {
        const queryResult = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        const user = queryResult.rows[0];
        if (!user) return res.json({ result: { user: null, token: null } });
        bcrypt.compare(password, user.password || "", function (err, result) {
            if (err) {
                console.error("Error comparing passwords:", err);
                return res.status(500).send("Internal Server Error");
            }
            if (result) {
                const token = jwt.sign({ id: user.userId }, process.env.JWT_SECRET || "default_secret", { expiresIn: "2 days" });
                return res.json({ result: { user, token } });
            } else {
                return res.json({ result: { user: null, token: null } });
            }
        });
    }
    catch (error) {
        console.error("Error validating user:", error);
        return res.status(500).send("Internal Server Error");
    }
}

export async function decryptToken(req: Request, res: Response) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(403).send("Header does not exist");
            return "";
        }
        const token = authHeader.split(" ")[1];
        const decodedUser = jwt.verify(token, "secret");
        const user = searchUserById((decodedUser as IDecodedUser).userId);
        res.json({ result: { user, token } });
    }
    catch (err) {
        res.status(401).json({ err });
    }
}

export async function searchUserById(id: number) {
    try {
        const result = await pool.query("SELECT * FROM users WHERE userid = $1", [id]);
        if (result.rows.length === 0) {
            return null;
        }
        const user = result.rows[0];
        return user;
    } catch (error) {
        console.error('Error executing query:', error);
        // throw new Error('Error searching user by ID');
    }
}

export async function createUser(req: Request, res: Response) {
    const { username, password, email } = req.body
    try {
        const usernameQuery = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        if (usernameQuery.rows[0]) {
            return res.json({ success: false, message: "Username already exists" });
        };
        const emailQuery = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (emailQuery.rows[0]) {
            return res.json({ success: false, message: "An account associated with this email already exists" });
        };
        const encrypted = await bcrypt.hash(password, saltRounds);
        const displayName = username;
        await pool.query("INSERT INTO users(username, password, email, display_name) VALUES ($1, $2, $3, $4)", [username, encrypted.toString(), email, displayName], (err, result) => {
            if (err) throw err
            res.status(201).send("User created successfully")
        })
    }
    catch (err) {
        console.log(err)
        res.status(400).json({ success: false, message: "Error creating user" })
    }
};

export function getUser(req: Request, res: Response) {
    const userId = req.params.userId
    pool.query("SELECT * FROM users WHERE user_id = $1", [userId], (error, results) => {
        if (error) throw error;
        console.log(results.rows[0].userid)
        res.status(200).json(results.rows);
    })
}

export async function updateUser(req: Request, res: Response) {
    try {
        const userId = parseInt(req.params.userId);
        const incomingUser = await req.body;
        const incomingPassword = incomingUser.password;
        const encrypted = await bcrypt.hash(incomingPassword, saltRounds);
        const updatedUser = await pool.query("UPDATE users SET password = $1 WHERE user_id = $2",
            [encrypted, userId]
        );
        res.status(200).json({ success: true });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Error updating user" });
    }
}

export async function addFriend(req: Request, res: Response) {
    try {
        const { friendName, username, userId } = req.body;
        const userResult = await pool.query("SELECT * FROM users WHERE username = $1", [friendName]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ success: false, message: "User does not exist" });
        }
        const friendId = userResult.rows[0].user_id;
        if (username === friendName) {
            return res.status(400).json({ success: false, message: "That's yourself!" });
        }
        const friendshipResult = await pool.query("SELECT * FROM user_friends WHERE user_id = $1 AND friend_id = $2", [userId, friendId]);
        if (friendshipResult.rows.length > 0) {
            return res.status(400).json({ success: false, message: "User is already your friend!" });
        }
        await pool.query("INSERT INTO user_friends(user_id, friend_id, display_name) VALUES ($1, $2, $3)", [userId, friendId, friendName]);
        await pool.query("INSERT INTO user_friends(user_id, friend_id, display_name) VALUES ($1, $2, $3)", [friendId, userId, username]);

        res.status(201).send("User Friend created successfully");
    } catch (error) {
        console.error("Error adding friend:", error);
        res.status(500).send("Internal Server Error");
    }
}

export async function getFriends(req: Request, res: Response) {
    try {
        const userId = req.params.userId;
        const friendsQuery = await pool.query(`
            SELECT users.*
            FROM user_friends
            INNER JOIN users ON user_friends.friend_id = users.user_id
            WHERE user_friends.user_id = $1
        `, [userId]);
        const friends = friendsQuery.rows;
        res.status(200).json({ success: true, friends });
    } catch (error) {
        console.error("Error getting friends:", error);
        res.status(500).json({ success: false, message: "Error getting friends" });
    }
}

export async function createChat(req: Request, res: Response) {
    try {
        const title = req.body.title;
        const incomingUser = req.body.user;
        const userQuery = await pool.query("SELECT * FROM users WHERE username = $1", [incomingUser])
        const user = userQuery.rows[0]
        const incomingFriend = req.body.friend;
        const friendQuery = await pool.query("SELECT * FROM users WHERE username = $1", [incomingFriend])
        const friend = friendQuery.rows[0]
        await pool.query("INSERT INTO chats(title) VALUES ($1)", [title]);
        const chatsQuery = await pool.query("SELECT * FROM chats WHERE title = $1", [title])
        const chatId = chatsQuery.rows[chatsQuery.rows.length - 1].chat_id;
        await pool.query("INSERT INTO user_chats(user_id, chat_id) VALUES ($1, $2)", [user.user_id, chatId]);
        await pool.query("INSERT INTO user_chats(user_id, chat_id) VALUES ($1, $2)", [friend.user_id, chatId]);
        res.status(200).json({ success: true, message: "Chat added successfully!" });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Error creating chat" });
    }
}

export async function getChats(req: Request, res: Response) {
    try {
        const userId = req.params.userId;
        const userChatsQuery = await pool.query(`
            SELECT chats.*
            FROM user_chats
            INNER JOIN chats ON user_chats.chat_id = chats.chat_id
            WHERE user_chats.user_id = $1
        `, [userId]);
        const chats = userChatsQuery.rows;
        res.status(200).json(chats);
    }
    catch (err) {
        console.error("Error getting chats:", err);
        res.status(500).json({ success: false, message: "Error getting chats" });
    }
}

export async function getChat(req: Request, res: Response) {
    try {
        const chatId = req.params.chatId;
        const chatQuery = await pool.query("SELECT * FROM chats WHERE chat_id = $1", [chatId]);
        const chat = chatQuery.rows[0]
        res.status(200).json(chat);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Error getting chat" });
    }
}

export async function leaveChat(req: Request, res: Response) {
    try {
        const userId = req.body.userId;
        const chatId = req.body.chatId;
        await pool.query("DELETE FROM user_chats WHERE user_id = $1 AND chat_id = $2", [userId, chatId])
        const userChatQuery = await pool.query("SELECT * FROM user_chats WHERE chat_id = $1", [chatId])
        const userChat = userChatQuery.rows;
        if (userChat.length === 0) {
            await pool.query("DELETE FROM chats WHERE chat_id = $1 ", [chatId])
            await pool.query("DELETE FROM messages WHERE chat_id = $1", [chatId])
        }
        res.status(200).json({ success: true });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Error leaving chat" });
    }
}

export async function createMessage(req: Request, res: Response) {
    const inputContent = req.body.content;
    const user = req.body.user;
    const chatId = req.body.chatId;
    try {
        await pool.query("INSERT INTO messages(content, username, chat_id) VALUES ($1, $2, $3)", [inputContent, user, chatId]);
        res.status(200).json({ success: true, message: "Message added successfully!" });
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ success: false, message: "Error creating message" });
    }
}

export async function getMessages(req: Request, res: Response) {
    try {
        const chatId = req.params.chatId;
        const messagesQuery = await pool.query("SELECT * FROM messages WHERE chat_id = $1", [chatId])
        const messages = messagesQuery.rows;
        res.status(200).json(messages)
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Error getting messages" });
    }
}

export async function updateMessage(req: Request, res: Response) {
    try {
        const messageId = req.params.messageId;
        const content = req.body.content
        const message = await pool.query("UPDATE messages SET content = $1 WHERE message_id = $2", [content, messageId])
        res.status(200).json({ success: true });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Error updating message" });
    }
}

export async function createComment(req: Request, res: Response) {
    try {
        const email = req.body.email;
        const content = req.body.content;
        await pool.query("INSERT INTO comments(email, content) VALUES ($1, $2)", [email, content]);
        res.status(200).json({ success: true });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Error sending comment" });
    }
}