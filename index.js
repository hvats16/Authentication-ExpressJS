import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"
import { error } from "console";


const app = express()
const port = 3000

const isAuthenticated = async (req, res, next) => {
    const { token } = req.cookies;
    if (token) {
        const decoded = jwt.verify(token, "sdfdfsfsdfeasdbcb");
        req.user = await User.findById(decoded._id);
        // console.log(decoded);
        next();
    } else {
        res.redirect("/login");
    }
}


mongoose.connect("mongodb://localhost:27017/", {
    dbName: "testDb",
}).then(() => {
    console.log("DB Connected");
}).catch((err) => {
    console.log(error);
})

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
});

const User = mongoose.model("User", userSchema)

//Using MiddleWares
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//Setting Up the view Engine
app.set("view engine", "ejs");


app.get('/', isAuthenticated, (req, res) => {
    // console.log(req.user);
    res.render("logout", { username: req.user.email })
})



app.get("/login", (req, res) => {
    res.render("login");
})

app.get("/register", (req, res) => {
    res.render("register")
})

app.post("/register", async (req, res) => {
    const { email, password } = req.body;
    const existedUser = await User.findOne({ email })
    if (existedUser) {
        return res.redirect("/login");
    }
    const hashedPassword = await bcrypt.hash(password,10);
    const user = await User.create({ email, password:hashedPassword });
    // const token = jwt.sign({ _id: user._id }, "sdfdfsfsdfeasdbcb");
    // res.cookie("token", token, {
    //     httpOnly: true,
    //     expires: new Date(Date.now() + 60 * 1000),
    // });

    res.redirect("/login")
})

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const existedUser = await User.findOne({ email });
    if (!existedUser) {
        return res.redirect("/register");
    }
    const isMatch = existedUser.password === password;
    if (!isMatch) {
        return res.render("login", { email, message: "Incorrect Password" });
    }
    // const user = await User.create({ email, password });
    const token = jwt.sign({ _id: existedUser._id }, "sdfdfsfsdfeasdbcb");
    res.cookie("token", token, {
        httpOnly: true,
    });

    res.redirect("/")
})

app.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/");
  });

// app.post('/', async (req, res) => {
//     const { name, email } = req.body;
//     await Message.create({ name, email });
//     res.redirect("/");
// })


app.listen(port, () => console.log(`Example app listening on port ${port}!`))