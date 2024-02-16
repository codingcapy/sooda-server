

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

export async function createUser(req: Request, res: Response) {
    const { username, password, email } = req.body
    const encrypted = await bcrypt.hash(password, saltRounds);
    pool.query("SELECT u FROM users u WHERE u.email = $1", [email], (err, result) => {
        if (result.rows.length) {
            return res.send("Email already exists")
        }
        pool.query("INSERT INTO users(username, password, email) VALUES ($1, $2, $3)", [username, encrypted.toString(), email], (err, result) => {
            if (err) throw err
            res.status(201).send("User created successfully")
        })
    })
}

export async function validateUser(req: Request, res: Response) {
    const { username, password } = req.body;
    console.log(username)
    console.log(password)
    pool.query("SELECT u FROM users u WHERE u.username = $1", [username], (err, result) => {
        if (err) throw err;
        console.log(result.rows.length)
        if (!result.rows.length) {
            return res.json({ result: { user: null, token: null } });
        }
        //@ts-ignore
        console.log(result.rows)
        //@ts-ignore
        bcrypt.compare(password, result.password || "", function (err, result2) {
            if (result2 === true) {
                //@ts-ignore
                const token = jwt.sign({ id: result.userId }, "secret", { expiresIn: "2days" });
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
    const user = pool.query("SELECT u FROM users u WHERE u.userId = $1", [id], (err, result) => {
        if (err) throw err;
        return result;
    })
    console.log(user)
    return user;
    // if (!user) throw new Error("User not found");
}

// export async function addFriend(req: Request, res: Response) {
//     const inputUser = req.body.username;
//     const user = await pool.query("SELECT u FROM users u WHERE u.email = $1")
//     const inputFriend = req.body.friend;
//     const friend = await pool.query
//     if (!friend) {
//         return res.json({ success: false, message: "User does not exist" });
//     }
//     if (user.friends.includes(friend.username)) {
//         return res.json({ success: false, message: "User is already your friend!" });
//     }
//     if (inputUser == inputFriend) {
//         return res.json({ success: false, message: "That's yourself!" });
//     }
//     await User.updateOne({ username: inputUser }, { $push: { friends: friend.username } });
//     await User.updateOne({ username: inputFriend }, { $push: { friends: user.username } });
//     res.status(200).json({ success: true, message: "Friend added successfully!" });
// }

