import express from "express";
import { createUser } from "../controller";

const users = express.Router();

users.route('/').post(createUser);

export default users;