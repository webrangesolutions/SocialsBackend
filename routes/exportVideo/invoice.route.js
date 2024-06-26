const express = require("express");
const invoiceController = require("../../controller/exportVideos/invoice.controller");


const invoiceRouter = express.Router();

invoiceRouter.get('/getInvoice/:id?', invoiceController.getInvoice);
invoiceRouter.get('/getWallet/:userId', invoiceController.getWallet);
invoiceRouter.put('/markPaid/:id?', invoiceController.markPaid);
invoiceRouter.get('/exportCsv/:id?', invoiceController.exportCsv);


module.exports =  invoiceRouter;
