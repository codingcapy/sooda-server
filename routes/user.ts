

import express from "express";
import { validateUser, decryptToken, addFriend } from "../controller";

const user = express.Router();

user.route('/login').post(validateUser);
user.route('/validation').post(decryptToken);
user.route('/friend/:userId').get(addFriend)

export default user;