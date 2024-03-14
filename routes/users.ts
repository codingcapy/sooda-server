import express from "express";
import { createUser, getUser, getUsers } from "../controller";

const users = express.Router();

users.route('/').get(getUsers).post(createUser);
users.route('/:userId').get(getUser)

export default users;