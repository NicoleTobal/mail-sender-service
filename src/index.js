const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const express = require('express')
var cors = require('cors');
const app = express();
var bodyParser = require('body-parser');

const whitelist = ["http://" + process.env.URL, "http://www." + process.env.URL];

app.use(express.static(__dirname));

app.use(bodyParser.urlencoded({ extended: true , type: "application/x-www-form-urlencoded"}));
app.use(bodyParser.json()); // support json encoded bodies
app.use(cors({
  origin: (origin, callback) => {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}));

let smtpTransport;

const refreshAuth = () => new Promise((resolve, reject) => {
  try {
    const oauth2Client = new OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );
    oauth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN
    });
    oauth2Client.getAccessToken((err, result) => {
      if (err) return reject(err);
      const accessToken = result.token;
      smtpTransport = nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: process.env.EMAIL, 
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            refreshToken: process.env.REFRESH_TOKEN,
            accessToken
        }
      });
      resolve();
    });
  } catch (error) {
    reject(error);
  }
});

const sendEmail = (from, subject, text, cb) => {
  refreshAuth().then(() => {
    const mailOptions = { from, to: process.env.EMAIL, subject, text };
    smtpTransport.sendMail(mailOptions, function(error, info){
      if (error) {
        cb(error);
      } else {
        console.log('Email sent: ' + info.response);
        cb();
      }
    });
  }).catch(error => cb(error));
};

//TODO: add input validations
app.post('/api/sendMail', (request, reply) => {
  const { name, email, subject, message } = request.body;
  const text = name + " (" + email + ")" + " sent the following message: \"" + message + "\"";
  sendEmail(email, subject, text, (error) => {
    if (error) return reply.status(500).send(error.message);
    reply.status(200).send("Email sent successfully!");
  });
})

app.listen(3000, () => console.log("App is listening at port 3000"));