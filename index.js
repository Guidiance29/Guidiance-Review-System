const express = require('express');
const { google } = require('googleapis');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Google API setup
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/submit-review', async (req, res) => {
  const { name, review } = req.body;

  try {
    // Save review to Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: 'Sheet1!A:B',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[name, review]],
      },
    });

    res.status(200).send('Review submitted successfully!');
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).send('An error occurred.');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
