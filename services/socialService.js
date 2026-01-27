// services/socialService.js
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");

exports.verifyGoogleIdToken = async (idToken) => {
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  return ticket.getPayload(); // { sub, email, name, picture, ... }
};

exports.verifyFacebookAccessToken = async (accessToken) => {
  const response = await axios.get("https://graph.facebook.com/me", {
    params: { access_token: accessToken, fields: "id,name,email,picture" },
  });
  return response.data; // { id, name, email?, picture? }
};
