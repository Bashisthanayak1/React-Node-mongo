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
// const isLoggedIn = (req, res, next) => {
//     try {
//         const token = req.headers.authorization;

//         if (token) {
//             const InfoFromToken = jwt.verify(token, process.env.jwt_SECRET);
//             req.user = InfoFromToken;
//         } else {
//             return res.status(401).json("JWT token not provided");
//         }
//         next();
//     } catch (error) {
//         console.log("Error in isLoggedIn middleware:", error.message);
//         res.status(401).json({
//             status: "Failed",
//             message: "Unauthorized: Please login first",
//         });
//     }
// };


//verify jwt
const verifyJWT = async (req, res, next) => {
    try {
        const getToken = await req.headers["x-access-token"];
        console.log('getToken in verifyJWT is:-  ', getToken);
        if (getToken) {
            jwt.verify(await getToken, process.env.jwt_SECRET, (err, decoded) => {
                if (err) {
                    console.log(err);
                    return res.json("jwtToken verify failed")
                } else {
                    console.log(decoded, "looging at verifyJWT");
                    //sending
                    req.userId = decoded;
                    next();
                }
            })
        } else {
            return res.send("unable to get token from req.headers x - access - token")
        }
    } catch (error) {
        console.error(error)
    }
}




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

        //converting our password to encrypt
        const encryptedPassword = await bcrypt.hash(Password, 10)
        const Userdetails = await User.create({ Name, Email, Mobile, Password: encryptedPassword })

        res.status(200).json({
            user: Userdetails,
        })
    }
    catch (err) {
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
            const userId = await FindingUser._id;

            const token = await jwt.sign({ userId }, process.env.jwt_SECRET, { expiresIn: 10 })

            //1st parameter is complete user details and 2nd is a random password which should private to me.
            res.json({
                status: 'SUCCESS',
                message: `${FindingUser.Mobile} - logedin successfully!`,
                token: token,
                FindingUser: FindingUser,
            })
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
app.post("/addJob", verifyJWT, async (req, res) => {

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
app.get("/AllPostedJobs", verifyJWT, async (req, res) => {
    try {
        const jobs = await Jobdescription.find();
        console.log(req.headers["x-access-token"], "accessing from verifyJWT logging in /AllPostedJobs");
        res.json(jobs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

//*************************************getting  posted Job by saved id on viewjob page  *************************************** */
app.get("/ViewJob/:ID", verifyJWT, async (req, res) => {
    try {
        const ids = req.params.ID;
        const particarData = await Jobdescription.findById(ids);
        console.log(particarData);
        res.json(particarData)
    } catch (error) {
        console.log(error);
    }
})
//*************************************getting  posted Job by saved id on viewjob page  *************************************** */
app.get("/filters", verifyJWT, async (req, res) => {
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
