require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("./models/User");

async function hashPassword() {

    try {

        await mongoose.connect(process.env.MONGO_URI);

        console.log("Connected to MongoDB Atlas");

        const password = "Demo@123";

        const hashedPassword = await bcrypt.hash(password, 12);

        await User.create({
            username: "admin",
            password: hashedPassword,
            role: "admin"
        });

        console.log("User created successfully");
        console.log("Password stored as bcrypt hash");

    } catch (error) {

        console.log(error);

    } finally {

        await mongoose.connection.close();

    }

}

hashPassword();