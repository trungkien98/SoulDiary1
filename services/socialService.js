// services/socialService.js
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");
const crypto = require("crypto");

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

// ====== BROWSER-BASED OAUTH ======
// In-memory storage for OAuth state (maps state -> appRedirectUri)
// For production, use Redis or database
const oauthStateMap = new Map();

// Store OAuth state with app redirect URI
exports.storeOAuthState = (state, appRedirectUri) => {
  oauthStateMap.set(state, { appRedirectUri, timestamp: Date.now() });
  // Auto-cleanup after 15 minutes
  setTimeout(() => oauthStateMap.delete(state), 15 * 60 * 1000);
};

// Retrieve and validate OAuth state
exports.getOAuthState = (state) => {
  const data = oauthStateMap.get(state);
  if (!data) return null;
  // Check if state hasn't expired (15 minutes)
  if (Date.now() - data.timestamp > 15 * 60 * 1000) {
    oauthStateMap.delete(state);
    return null;
  }
  oauthStateMap.delete(state); // Consume state (single-use)
  return data;
};

// Generate Google OAuth consent URL for browser-based flow
exports.generateGoogleConsentUrl = (backendCallbackUri, appRedirectUri) => {
  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    backendCallbackUri // Backend callback URI
  );

  const state = crypto.randomBytes(32).toString('hex');
  // Store state with app redirect URI for later retrieval
  exports.storeOAuthState(state, appRedirectUri);
  
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    state,
  });

  return { authUrl, state };
};

// Exchange Google auth code for tokens
exports.exchangeGoogleCode = async (code, redirectUri) => {
  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  const { tokens } = await client.getToken(code);
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  return {
    idToken: tokens.id_token,
    accessToken: tokens.access_token,
    payload: ticket.getPayload(),
  };
};

// Generate Facebook OAuth consent URL for browser-based flow
exports.generateFacebookConsentUrl = (backendCallbackUri, appRedirectUri) => {
  const state = crypto.randomBytes(20).toString('hex');
  const fbAuthUrl = 'https://www.facebook.com/v19.0/dialog/oauth';
  
  // Store state with app redirect URI for later retrieval
  exports.storeOAuthState(state, appRedirectUri);
  
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_CLIENT_ID,
    redirect_uri: backendCallbackUri,
    scope: 'public_profile,email',
    state,
  });

  return {
    authUrl: `${fbAuthUrl}?${params.toString()}`,
    state,
  };
};

// Exchange Facebook auth code for tokens
exports.exchangeFacebookCode = async (code, redirectUri) => {
  // Facebook token exchange endpoint
  const tokenUrl = 'https://graph.facebook.com/v18.0/oauth/access_token';
  
  const response = await axios.get(tokenUrl, {
    params: {
      client_id: process.env.FACEBOOK_CLIENT_ID,
      client_secret: process.env.FACEBOOK_CLIENT_SECRET,
      redirect_uri: redirectUri,
      code,
    },
  });

  const accessToken = response.data.access_token;

  // Get user info
  const userResponse = await axios.get('https://graph.facebook.com/me', {
    params: {
      access_token: accessToken,
      fields: 'id,name,email,picture',
    },
  });

  return {
    accessToken,
    userData: userResponse.data,
  };
};
