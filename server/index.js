const express = require('express');
const mongoose = require('mongoose')
const dotenv = require('dotenv')

dotenv.config();

const app = express();

app.get('/', (req, res) => {
    res.send("Welcome to Home page ")
})

app.listen(process.env.PORT, async () => {
    mongoose.connect(process.env.MONGODB_URL)
    console.log(`server running on port ${process.env.PORT}`);
})