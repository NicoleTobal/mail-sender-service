const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const express = require('express')
var cors = require('cors');
const app = express();
var bodyParser = require('body-parser');

const config = require("./config.json");

const whitelist = ["https://" + process.env.URL, "https://www." + process.env.URL];

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

const getOauthClient = (refreshToken) => {
  const oauth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );
  oauth2Client.credentials = {
    refresh_token: refreshToken
  };
  return oauth2Client;
}

const refreshAuth = (refreshToken) => new Promise((resolve, reject) => {
  try {
    const oauth2Client = getOauthClient(refreshToken);
    oauth2Client.getAccessToken((err, token) => {
      if (err) return reject(err);
      const accessToken = token;
      resolve(accessToken);
    });
  } catch (error) {
    reject(error);
  }
});

const getSmptTransport = (accessToken) => {
  return nodemailer.createTransport({
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
}

const sendEmail = (from, to, subject, text, cb) => {
  refreshAuth(process.env.REFRESH_TOKEN).then(accessToken => {
    const mailOptions = { from, to, subject, text };
    const smtpTransport = getSmptTransport(accessToken);
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

const subscribe = (value, cb) => {
  refreshAuth(process.env.REFRESH_TOKEN_GOOGLE_PEOPLE).then(accessToken => {
    const oauth2Client = getOauthClient(process.env.REFRESH_TOKEN_GOOGLE_PEOPLE);
    oauth2Client.credentials = {
      access_token: accessToken
    };
    google.people('v1').people.createContact({
      requestBody: {
        emailAddresses: [{value}]
      },
      auth: oauth2Client
    }, function (err, response) {
      if (err) cb(err);
      console.log("User subscribed: ", response);
      cb();
    });
  }).catch(error => cb(error));
};

//TODO: add input validations
app.post('/api/sendMail', (request, reply) => {
  const { name, email, subject, message } = request.body;
  const text = name + " (" + email + ")" + " sent the following message: \"" + message + "\"";
  sendEmail(email, process.env.EMAIL, subject, text, (error) => {
    if (error) return reply.status(500).send(error.message);
    reply.status(200).send("Email sent successfully!");
  });
})

app.post('/api/subscribe', (request, reply) => {
  const { email } = request.body;
  const text = config.subscribeMessage;
  const subject = config.subscribeSubject;
  subscribe(email, (error) => {
    if (error) return reply.status(500).send(error.message);
    sendEmail(process.env.EMAIL, email, subject, text, (error) => {
      if (error) return reply.status(500).send(error.message);
      reply.status(200).send("User successfully subscribed!");
    });
  });
})

app.listen(3000, () => console.log("App is listening at port 3000"));