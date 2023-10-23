const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var cors = require('cors');
const dotenv = require('dotenv');
const app = express();

dotenv.config();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use(express.static('./public'))
app.use(cors());

const User = mongoose.model('User', {
    Name: String,
    Email: String,
    Mobile: String,
    Password: String,
});

app.get('/', (req, res) => {
    res.send("Home Page")
})


app.get("/health", (req, res) => {
    res.status(200).json({ message: "Server is up and running" })
})

//GET /users (Read)
app.get('/users', async (req, res) => {
    try {
        const users = await User.find()
        res.json({
            status: 'SUCCESS',
            data: users
        })
    } catch (err) {
        res.status(500).json({
            status: 'FAIL',
            message: 'Something went wrong'
        })
    }
});

// POST /users (Create)
app.post('/users', async (req, res) => {
    try {
        const { Name, Email, Mobile, Password } = req.query;
        await User.create({ Name, Email, Mobile, Password })
        res.json({
            status: 'SUCCESS',
            message: 'User added successfully!'
        })
    } catch (err) {
        res.status(500).json({
            status: 'FAIL',
            message: 'Something went wrong'
        })
    }
});

app.listen(process.env.PORT, () => {
    mongoose
        .connect(process.env.MONGODB_URL)
        .then(() => console.log(`Server running on ${process.env.PORT}`))
        .catch(error => console.log(error));
})
























