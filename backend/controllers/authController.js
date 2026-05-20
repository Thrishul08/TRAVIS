const User = require('../models/User');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Read JWT_SECRET from environment variable (set in .env or by docker-compose)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Controller for user signup
const signup = async (req, res) => {
    let success = false;
    // If there are errors, return Bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success, errors: errors.array() });
    }

    try {
        // Check whether the user with this email exists already
        let user = await User.findOne({ email: req.body.email });
        // console.log(user)  
        if (user) {
            return res.status(400).json({ success, error: "Sorry, a user with this email already exists" })
        }

        const salt = await bcrypt.genSalt(10);
        const secPass = await bcrypt.hash(req.body.password, salt);
        // create a new user
        user = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: secPass,
        });

        const data = {
            user:{
                id: user.id
            } 
        }
        const authToken = jwt.sign(data, JWT_SECRET);

        // res.json(user);
        success = true;
        res.json({success, authToken});

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some Error occured");
    }
};

// Controller for user login
const login = async (req, res) => {
    let success = false;
    // If there are errors, return Bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
        let user = await User.findOne({email});
        if(!user) {
            // success = false;
            return res.status(400).json({success, error: "Please try to login with correct credentials."});
        }

        const passwordCompare = await bcrypt.compare(password, user.password);
        if (!passwordCompare) {
            // success = false;
            return res.status(400).json({ success, error: "Please try to login with correct credentials." });
        }

        const data = {
            user:{
                id: user.id
            } 
        }
        const authToken = jwt.sign(data, JWT_SECRET);
        success = true;
        res.json({ success, authToken });

    } catch(error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
};

// Controller to get user details
const getUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("-password")
        res.send(user)
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = { signup, login, getUser };