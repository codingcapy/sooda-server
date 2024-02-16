

import { Request, Response } from "express";
import bcrypt from "bcrypt";
import pool from "./connect";

const saltRounds = 6

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