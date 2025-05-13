const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Handle GET requests to root URL
app.get('/', (req, res) => {
  res.send('Welcome to the Twilio call trigger app!');
});

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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
