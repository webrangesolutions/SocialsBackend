const express = require("express");
const paymentMethodController = require("../../controller/paymentMethod/paymentMethod.controller");

const paymentMethodRouter = express.Router();

paymentMethodRouter.post("/addPaymentMethod", paymentMethodController.createPaymentMethod);


module.exports =  paymentMethodRouter;
