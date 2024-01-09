require('dotenv').config()

const Alpaca = require("@alpacahq/alpaca-trade-api");
const { dot } = require("@tensorflow/tfjs");
const alpaca = new Alpaca({
    keyId: process.env.ALPACA_API_KEY, 
    secretKey: process.env.ALPACA_SECRET_KEY, 
    paper: true,
  });

  module.exports=alpaca