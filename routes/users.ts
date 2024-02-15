import express from "express";
import { createUser, getUsers } from "../controller";

const users = express.Router();

users.route('/').get(getUsers).post(createUser);

export default users;