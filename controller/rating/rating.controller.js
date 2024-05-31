const Rating = require("../../models/rating.model");

const ratingController = {
  async rateVideo(req, res) {
      
      let ratingData = req.body;
     
        const rating = new Rating(ratingData);

        try {
          const registeredRating = await rating.save();
          res.status(200).send({
            message: "Rating give successfully",
            data: rating
          });
        } catch (error) {
          res.status(500).send({ message: error.message });
        }
  },
  
};

module.exports = ratingController;

// router.rating("/login", async (req, res) => {
// });
