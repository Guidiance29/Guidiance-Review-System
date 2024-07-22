const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const upload = multer({ dest: 'uploads/' });

// Google API setup
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
  scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/spreadsheets'],
});

const drive = google.drive({ version: 'v3', auth });
const sheets = google.sheets({ version: 'v4', auth });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/submit-review', upload.single('picture'), async (req, res) => {
  const { name, review } = req.body;
  const file = req.file;

  try {
    // Upload picture to Google Drive
    const driveResponse = await drive.files.create({
      requestBody: {
        name: file.originalname,
        mimeType: file.mimetype,
      },
      media: {
        mimeType: file.mimetype,
        body: fs.createReadStream(path.join(__dirname, file.path)),
      },
    });

    const fileId = driveResponse.data.id;
    const fileUrl = `https://drive.google.com/uc?id=${fileId}`;

    // Save review to Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: 'Sheet1!A:C',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[name, review, fileUrl]],
      },
    });

    res.status(200).send('Review submitted successfully!');
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).send('An error occurred.');
  } finally {
    fs.unlinkSync(path.join(__dirname, file.path));
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
