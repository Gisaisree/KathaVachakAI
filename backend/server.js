const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const cors = require("cors");
const { createStoryProxy, buildCorsOptions } = require("./storyProxy");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 6000;

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err); // Log the connection error
  });

// Middleware
// Allowed origin(s) come from CORS_ORIGIN (comma-separated); defaults to the local dev frontend.
const corsOptions = buildCorsOptions(process.env.CORS_ORIGIN);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: "256kb" }));

// User Schema and Model
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token." });
    req.user = user; // Attach user data to the request object
    next();
  });
};

// Signup Route
// Signup Route
app.post("/api/signup", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // Check if email is valid and ends with '@gmail.com'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || !email.endsWith("@gmail.com")) {
      return res.status(400).json({ message: "Email must be a valid Gmail address." });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12); // Increased salt rounds for security
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user to the database
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "singnup is successful" });
  } catch (err) {
    console.error("Error during signup:", err);  // Log the full error message
    res.status(500).json({ message: "An error occurred. Please try again." });
  }
});


// Login Route
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ message: "Login successful.", token });
  } catch (err) {
    console.error("Error during login:", err);  // Log the full error message
    res.status(500).json({ message: "An error occurred. Please try again." });
  }
});

// Protected Route
app.get("/api/protected", authenticateToken, (req, res) => {
  res.json({ message: "This is a protected route.", user: req.user });
});

// Story generation and readout: proxied to the external services configured via env vars.
// Authenticated so the upstream services are not exposed as an open proxy.
const storyProxy = createStoryProxy();
app.post("/api/story/generate", authenticateToken, storyProxy.generate);
app.post("/api/story/readout", authenticateToken, storyProxy.readout);

// Default Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});