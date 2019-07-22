const paypal = require('@paypal/checkout-server-sdk');

// Creating an environment
let client = null
if (!process.env.PAYPAL_CLIENTID || !process.env.PAYPAL_CLIENTSECRET || !process.env.PAYPAL_ENVIRONMENT) {
  console.warn('You must set the environmental variables: PAYPAL_CLIENTID, PAYPAL_CLIENTSECRET, and PAYPAL_ENVIRONMENT before starting server')
} else {
  let clientId =  process.env.PAYPAL_CLIENTID
  let clientSecret = process.env.PAYPAL_CLIENTSECRET
  let environment = process.env.PAYPAL_ENVIRONMENT == "live"
    ? new paypal.core.LiveEnvironment(clientId, clientSecret)
    : new paypal.core.SandboxEnvironment(clientId, clientSecret)
  client = new paypal.core.PayPalHttpClient(environment)
}

module.exports = client;
