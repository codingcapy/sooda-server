

import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "./connect";

const saltRounds = 6

export interface IDecodedUser {
    userId: number
};

export function getUsers(req: Request, res: Response) {
    pool.query("SELECT * FROM users", (error, results) => {
        if (error) throw error;
        res.status(200).json(results.rows);
    })
}

export function getUser(req: Request, res: Response) {
    const userId = req.params.userId
    pool.query("SELECT * FROM users WHERE user_id = $1", [userId], (error, results) => {
        if (error) throw error;
        console.log(results.rows[0].userid)
        res.status(200).json(results.rows);
    })
}

export async function createUser(req: Request, res: Response) {
    const { username, password, email } = req.body
    try {
        const usernameQuery = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        if (usernameQuery.rows[0]) {
            res.json({ success: false, message: "Username already exists" });
        };
        const emailQuery = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (emailQuery.rows[0]) {
            res.json({ success: false, message: "An account associated with this email already exists" });
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
