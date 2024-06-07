const HelpAndSupport = require("../../models/helpAndSupport");

const helpAndSupportController = {
  async createHelpAndSupport(req, res) {
      
      let helpAndSupportData = req.body;
     
        const helpAndSupport = new HelpAndSupport(helpAndSupportData);

        try {
          await helpAndSupport.save();
          res.status(200).send({
            message: "HelpAndSupport created successfully",
            data: helpAndSupport
          });
        } catch (error) {
          res.status(500).send({ message: error.message });
        }
  },

  async getUserHelpAndSupport(req, res) {
      
    let {id} = req.params
    
      try {
        let query
        if (id) {
          query = { userId: id, ...req.body };
        } else {
          query = { ...req.body };
        }

        await HelpAndSupport.find(query)
          .then((result) => {
            return res.status(200).send({
              success: true,
              data: { message: "HelpAndSupport Found",
                    helpAndSupports : result
               },
            });
          })
          .catch((err) => {
            return res
              .status(400)
              .send({ success: false, data: { error: err.message } });
          });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
},
  
};

module.exports = helpAndSupportController;

// router.helpAndSupport("/login", async (req, res) => {
// });
