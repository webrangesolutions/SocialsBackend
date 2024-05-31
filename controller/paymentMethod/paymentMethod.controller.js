const PaymentMethod = require("../../models/paymentMethod.model");

const paymentMethodController = {
  async createPaymentMethod(req, res) {
      
      let paymentMethodData = req.body;
     
        const paymentMethod = new PaymentMethod(paymentMethodData);

        try {
          const PaymentMethod = await paymentMethod.save();
          res.status(200).send({
            message: "PaymentMethod created successfully",
            data: paymentMethod
          });
        } catch (error) {
          res.status(500).send({ message: error.message });
        }
  },
  
};

module.exports = paymentMethodController;

// router.paymentMethod("/login", async (req, res) => {
// });
