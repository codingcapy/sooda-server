
/*
Author: Paul, Jessie, Beanie
Date: February 14, 2024
Version: 0.0.1
Description: App for Sooda server
 */

import express from "express";
import cors from "cors"

const app = express();
const port = 3333;

app.use(cors())
app.get("/", (req, res) => res.send("welcome"));

app.listen(port, () => console.log(`Server listeining on port : ${port}`));