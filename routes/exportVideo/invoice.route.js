const express = require("express");
const invoiceController = require("../../controller/exportVideos/invoice.controller");


const invoiceRouter = express.Router();

invoiceRouter.get('/', invoiceController.getInvoice);
invoiceRouter.get('/getWallet/:userId', invoiceController.getWallet);
invoiceRouter.put('/markPaid/:id?', invoiceController.markPaid);
invoiceRouter.get('/exportCsv', invoiceController.exportCsv);


module.exports =  invoiceRouter;
