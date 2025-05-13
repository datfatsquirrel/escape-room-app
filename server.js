const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from current directory

const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');

const USERNAME = process.env.AUTH_USER || 'admin';
const PASSWORD = process.env.AUTH_PASS || 'secret';

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
  secret: 'escapeRoomSecretKey',
  resave: false,
  saveUninitialized: false
}));

function authMiddleware(req, res, next) {
  if (req.session && req.session.loggedIn) {
    next();
  } else {
    res.redirect('/login');
  }
}

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === USERNAME && password === PASSWORD) {
    req.session.loggedIn = true;
    res.redirect('/');
  } else {
    res.send('Invalid credentials. <a href="/login">Try again</a>.');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.use(authMiddleware);

app.use(express.static(path.join(__dirname)));

app.use(bodyParser.json());

app.post('/trigger', async (req, res) => {
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

// Catch-all route for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
