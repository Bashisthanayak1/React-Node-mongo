const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var cors = require('cors');
const dotenv = require('dotenv');

//use this npm to hide our password
const bcrypt = require('bcrypt')

//using it for tracking a user login
const jwt = require('jsonwebtoken')


const app = express();

dotenv.config();

//It passes the details which are coming from simple form 
app.use(bodyParser.urlencoded({ extended: false }));
//To process json data we use this middleware
app.use(bodyParser.json())
app.use(cors());

const User = mongoose.model('User', {
    Name: String,
    Email: { type: String, unique: true },
    Mobile: String,
    Password: String,
});


//creating middleware for admin
//using -headers(Meta data)
const isLoggedIn = (req, res, next) => {
    try {
        const jwttoken = req.headers.token
        //trying to fetch all user information from token
        const InfoFromToken = jwt.verify(jwttoken, process.env.jwt_SECRET)

        //Attach this user to request object 
        req.InfoFromToken = InfoFromToken
        next()

    } catch (error) {
        console.log(error);
        res.json({
            status: "Failed",
            message: "Please login first"
        })

    }


}


//Authentication
app.get('/dashboard', isLoggedIn, (req, res) => {
    res.send(`Welcome :- ${req.InfoFromToken.Name}`)
})


//Authentication+admin(Authorization)
app.get('/admin', isLoggedIn, (req, res) => {
    res.send("This is admin Page")
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

// POST /users (Create)- register ***************************************************************
app.post('/register', async (req, res) => {
    try {
        const { Name, Email, Mobile, Password } = req.body;

        const IsEmailExists = await User.findOne({ Email })

        if (IsEmailExists) {
            //printing in vs code
            console.log("Email exists");
            return res.status(500).json({
                status: 'FAIL',
                message: 'Email Exists'
            })
        }

        const encryptedPassword = await bcrypt.hash(Password, 10)

        await User.create({ Name, Email, Mobile, Password: encryptedPassword })
        res.json({
            status: 'SUCCESS',
            message: 'User added successfully!'
        })
    } catch (err) {
        console.log(err);

        res.status(500).json({
            status: 'FAIL',
            message: 'Something went wrong'
        })
    }
});


//Login ***************************************************************
app.post('/login', async (req, res) => {
    try {
        const { Email, Password } = req.body;
        //checking if the email is registred or not
        const FindingUser = await User.findOne({ Email })
        if (!FindingUser) {
            console.log("Email not exists");
            return res.status(500).json({
                status: 'FAIL',
                message: 'Email not exists'
            })
        }
        //1st is whatever password comming from the client and another is the encrypted password saved in database
        let SavedPassword = await FindingUser.Password
        const passwordMatched = await bcrypt.compare(Password, SavedPassword);
        console.log(passwordMatched);
        //if the password not matched return the same message
        if (!passwordMatched) {
            console.log("Invalid password");
            return res.status(500).json({
                status: 'FAIL',
                message: 'Invalid password'
            })
        }

        //If both email and password matched
        if (FindingUser && passwordMatched) {
            //1st parameter is complete user details and 2nd is a random password which should private to me.
            const jwttoken = jwt.sign(FindingUser.toJSON(), process.env.jwt_SECRET, { expiresIn: 300 })

            res.json({
                status: 'SUCCESS',
                message: `${FindingUser.Mobile} - logedin successfully!`,
                jwttoken: jwttoken,
            })
            console.log(`${FindingUser.Mobile} logedin`);
        }

    }
    catch (err) {
        console.log(err);
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
























