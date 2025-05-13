const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const twilio = require('twilio');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session setup
app.use(session({
  secret: 'super_secret_key', // Use a strong secret in production
  resave: false,
  saveUninitialized: false
}));

// Serve static files (optional if you want to use styles/images from /public folder)
app.use(express.static(path.join(__dirname, 'public')));

// Use env vars for login credentials
const loginUsername = process.env.LOGIN_USERNAME;
const loginPassword = process.env.LOGIN_PASSWORD;
const loginPasswordHash = bcrypt.hashSync(loginPassword, 10);

// Auth check using session
const users = {
  [loginUsername]: {
    username: loginUsername,
    passwordHash: loginPasswordHash
  }
};

// Auth middleware
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login');
}

// Serve login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Handle login submission
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];

  if (user && bcrypt.compareSync(password, user.passwordHash)) {
    req.session.user = username;
    res.redirect('/');
  } else {
    res.send('Invalid credentials. <a href="/login">Try again</a>.');
  }
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// ✅ Protected: Serve index.html only if logged in
app.get('/', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ✅ Protected: Handle Twilio trigger POST request
app.post('/trigger', isAuthenticated, async (req, res) => {
  const { phone, step } = req.body;
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  try {
    await client.studio.flows(process.env.TWILIO_FLOW_SID)
      .executions
      .create({
        to: phone,
        from: process.env.TWILIO_FROM_NUMBER,
        parameters: { step: String(step) }
      });

    res.send('Call triggered for step ' + step);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error triggering call: ' + error.message);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
