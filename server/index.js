const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var cors = require('cors');
const dotenv = require('dotenv');
//use this npm to hide our password
const bcrypt = require('bcrypt')
//using it for tracking a user login
const jwt = require('jsonwebtoken');
const app = express();
// const ejs = require("ejs");
dotenv.config();

//It passes the details which are coming from simple form 
app.use(bodyParser.urlencoded({ extended: false }));
//To process json data we use this middleware
app.use(bodyParser.json())
app.use(cors());


//schema for registration
const User = mongoose.model('User', {
    Name: String,
    Email: { type: String, unique: true },
    Mobile: String,
    Password: String,
});


//creating dataSchema in mongoDB for job entry
const Jobdescription = mongoose.model('Jobdescription', {
    CompanyName: String,
    CompanyLogo: String,
    JobPosition: String,
    Salary: String,
    jobtype: String,
    RemoteORoffice: String,
    Location: String,
    JobDescription: String,
    AboutCompany: String,
    SkillsRequired: String,
    Information: String,
})

//creating middleware for /admin
//using -headers(Meta data)
const isLoggedIn = (req, res, next) => {
    try {
        const jwttoken = req.headers.jwttoken
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


//Authentication+admin(Authorization)
app.get('/admin', isLoggedIn, (req, res) => {
    res.send("This is admin Page")
})

app.get("/health", (req, res) => {
    res.status(200).json({ message: "Server is up and running" })
})

//***************************** POST /users (Create)- register ****************************************

app.post('/register', async (req, res) => {
    try {
        const { Name, Email, Mobile, Password } = req.body;

        const IsEmailExists = await User.findOne({ Email })
        const IsMobileExists = await User.findOne({ Mobile })

        if (IsEmailExists && IsMobileExists) {
            //printing in vs code
            console.log("Mobile and Email exists");
            return res.status(500).json({
                status: 'FAIL',
                message: 'Mobile and Email Exists'
            })
        }
        if (IsEmailExists) {
            //printing in vs code
            console.log("Email exists");
            return res.status(500).json({
                status: 'FAIL',
                message: 'Email Exists'
            })
        }
        if (IsMobileExists) {
            //printing in vs code
            console.log("Mobile exists");
            return res.status(500).json({
                status: 'FAIL',
                message: 'Mobile Exists'
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

//Login ****************************************************************************************
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
            const jwttoken = jwt.sign(FindingUser.toJSON(), process.env.jwt_SECRET, { expiresIn: 60 })
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


//************************************* Job description posting *************************************** */
app.post("/addJob", async (req, res) => {

    try {
        //accesing data from Jobdescription page
        const {
            CompanyName,
            CompanyLogo,
            JobPosition,
            Salary,
            jobtype,
            RemoteORoffice,
            Location,
            JobDescription,
            AboutCompany,
            SkillsRequired,
            Information,
        } = req.body;

        //mongodb
        await Jobdescription.create({
            CompanyName,
            CompanyLogo,
            JobPosition,
            Salary,
            jobtype,
            RemoteORoffice,
            Location,
            JobDescription,
            AboutCompany,
            SkillsRequired,
            Information
        })

        res.json({
            status: 'SUCCESS',
            message: 'Job Description added successfully!'
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            status: 'FAIL',
            message: 'Something went wrong'
        })
    }
})

//*************************************getting all posted Job on homepage  *************************************** */
app.get("/AllPostedJobs", isLoggedIn, async (req, res) => {
    const jobs = await Jobdescription.find();
    console.log(req.InfoFromToken);
    res.json(jobs)
})

//*************************************getting  posted Job by saved id on viewjob page  *************************************** */
app.get("/ViewJob/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const particarData = await Jobdescription.findById(id);
        res.json(particarData)
    } catch (error) {
        console.log(error);
    }
})
//*************************************getting  posted Job by saved id on viewjob page  *************************************** */
app.get("/filters", async (req, res) => {
    try {
        // 1. filter criteria 2. what to return and not
        const AfilterString = req.query.Afilter;
        console.log("Received AfilterString:", AfilterString);

        const Afilter = AfilterString.split(',').map(skill => new RegExp(skill.trim(), 'i'));
        console.log("Parsed Afilter:", Afilter);
        const JOB = await Jobdescription.find(
            {
                SkillsRequired: { $in: Afilter },
            },
            {
                CompanyName: 1,
                CompanyLogo: 1,
                JobPosition: 1,
                Salary: 1,
                jobtype: 1,
                RemoteORoffice: 1,
                Location: 1,
                JobDescription: 1,
                AboutCompany: 1,
                Information: 1,
                SkillsRequired: 1// Exclude the Information field
            }
        );
        res.json(JOB);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


app.listen(process.env.PORT, () => {
    mongoose
        .connect(process.env.MONGODB_URL)
        .then(() => console.log(`Server running on ${process.env.PORT}`))
        .catch(error => console.log(error));
})
