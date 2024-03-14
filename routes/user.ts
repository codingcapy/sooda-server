

import express from "express";
import { validateUser, decryptToken, addFriend } from "../controller";

const user = express.Router();

user.route('/login').post(validateUser);
user.route('/validation').post(decryptToken);
user.route('/friend').post(addFriend)

export default user;