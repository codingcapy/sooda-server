

import { Request, Response } from "express";
import pool from "./connect";

export function getUsers(req: Request, res: Response) {
    pool.query("SELECT * FROM users", (error, results) => {
        if (error) throw error;
        res.status(200).json(results.rows);
    })
}

export function createUser(req: Request, res: Response) {
    const { username, password, email, } = req.body
    pool.query("")
}