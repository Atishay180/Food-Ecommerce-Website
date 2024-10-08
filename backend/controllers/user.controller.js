import { User } from "../models/user.model.js"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import validator from "validator"

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET)
}

//register user
const registerUser = async (req, res) => {
    const { name, password, email } = req.body

    try {
        if (name === "" || password === "" || email === "") {
            res.json({ success: false, message: "All fields are required" })
        }

        const exists = await User.findOne({ email })

        if (exists) {
            res.json({ success: false, message: "User already exists" })
        }

        //validate email format & strong password
        if (!validator.isEmail(email)) {
            res.json({ success: false, message: "Please enter valid email" })
        }

        if (password.length < 8) {
            res.json({ success: false, message: "Please enter a strong password" })
        }

        //hash user password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword
        })

        if (!newUser) {
            res.json({ success: false, message: "An error occured while registering the user, please try again " })
        }

        const token = createToken(newUser._id)

        return res.json({ success: true, token, message: "Registered successfully, explore wide range of food with its authencity and taste" })
    } catch (error) {
        console.log("User Already exists");
        res.json({ success: false, message: "User Already exists" })
    }
}

//login user 
const loginUser = async (req, res) => {
    const { email, password } = req.body

    try {
        const user = await User.findOne({ email })
        if (!user) {
            res.json({ success: false, message: "User does not exist" })
        }

        const isMatched = await bcrypt.compare(password, user.password)

        if (!isMatched) {
            res.json({ success: false, message: "You have entered Invalid Credentials" })
        }

        const token = createToken(user._id)

        return res.json({ success: true, token, message: `Welcome back! ${user.name}` })
    } catch (error) {
        console.log("Failed to login");
        res.json({ success: false, message: "Failed to login" })
    }
}
export { loginUser, registerUser }