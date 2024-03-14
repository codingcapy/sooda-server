

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
    const displayName = username;
    const encrypted = await bcrypt.hash(password, saltRounds);
    pool.query("SELECT u FROM users u WHERE u.email = $1", [email], (err, result) => {
        if (result.rows.length) {
            return res.send("Email already exists")
        }
        pool.query("INSERT INTO users(username, password, email, display_name) VALUES ($1, $2, $3, $4)", [username, encrypted.toString(), email, displayName], (err, result) => {
            if (err) throw err
            res.status(201).send("User created successfully")
        })
    })
}

export async function validateUser(req: Request, res: Response) {
    const { username, password } = req.body;
    console.log(username)
    console.log(password)
    pool.query("SELECT * FROM users WHERE username = $1", [username], (err, result) => {
        if (err) throw err;
        console.log(result.rows.length)
        if (!result.rows.length) {
            return res.json({ result: { user: null, token: null } });
        }
        bcrypt.compare(password, result.rows[0].password || "", function (err, result2) {
            console.log(result2)
            if (result2 === true) {
                const token = jwt.sign({ id: result.rows[0].userId }, "secret", { expiresIn: "2days" });
                return res.json({ result: { result, token } });
            }
            else {
                return res.json({ result: { user: null, token: null } });
            }
        })
    });
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
    const userId = req.body.userId;
    const username = req.body.username;
    const friendName = req.body.friendName;
    const displayName = req.body.displayName;
    pool.query("SELECT * FROM users WHERE username = $1", [friendName], (err, result) => {
        if (result.rows.length === 0) {
            return res.json({ success: false, message: "User does not exist" });
        }
        if (username === friendName) {
            return res.json({ success: false, message: "That's yourself!" });
        }
        pool.query("SELECT * FROM user_friends WHERE user_id = $1 AND friend_id = $2", [userId, result.rows[0].user_id], (err2, result2) => {
            if (result2.rows.length > 0) {
                return res.json({ success: false, message: "User is already your friend!" });
            }
            pool.query("INSERT INTO user_friends(user_id, friend_id, display_name) VALUES ($1, $2, $3)", [userId, result.rows[0].user_id, displayName], (err3, result3) => {
                if (err) throw err
                res.status(201).send("User Friend created successfully")
            })
        })
    })
}

