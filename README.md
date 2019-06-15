## Mail Sender Service

### Description

A basic service to send emails using Nodejs Nodemailer and the Gmail API.

### Gmail API tokens

To obtain the client id, the client secret and the refresh token from google, the following tutorial is followed:

https://medium.com/@RistaSB/use-expressjs-to-send-mails-with-gmail-oauth-2-0-and-nodemailer-d585bba71343

### ENV variables

- URL: the only url that will be allowed to call this service, otherwise a CORS error will be thrown
- CLIENT_ID
- CLIENT_SECRET
- REFRESH_TOKEN
- EMAIL: the email that will send and receive the mail

### Endpoint

- **POST /api/sendMail**, receives:
    - name: type String
    - email: type String
    - subject: type String
    - message: type String

- **POST /api/subscribe**, receives:
    - email: type String

### Run local

First all environment variables need to be exported, then configure the values in the config.json and then run:

> npm start

### Run on server with pm2

Start service with pm2:

> URL="FakeUrl" EMAIL="FakeEmail" CLIENT_ID="FakeClientId" CLIENT_SECRET="FakeClientSecret" REFRESH_TOKEN="FakeRefreshToken" pm2 start index.js

Restart the service updating the env variables:

> URL="FakeUrl" EMAIL="FakeEmail" CLIENT_ID="FakeClientId" CLIENT_SECRET="FakeClientSecret" REFRESH_TOKEN="FakeRefreshToken" pm2 restart index --update-env