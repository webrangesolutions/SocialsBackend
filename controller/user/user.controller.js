const User = require("../../models/user.model");

const bcrypt = require("bcryptjs");

const userController = {
    // .................. update image .............................
    async updateUserImage(req, res) {
        try {
          const {id} = req.params
          let image =req.fileUrl
    
          if (!image) {
            return res
              .status(400)
              .send({
                success: false,
                data: { error: "Please provide image" },
              });
          } else {
            await User.findOneAndUpdate(
              { _id: id },
              { image },
              { new: true, useFindAndModify: false }
            )
              .then((result) => {
                return res.status(200).send({
                  success: true,
                  data: { message: "Image updated" },
                });
              })
              .catch((err) => {
                return res
                  .status(400)
                  .send({ success: false, data: { error: err.message } });
              });
          }
        } catch (error) {
          return res.status(404).send({
            success: false,
            data: { error: error.response },
          });
        }
      },

       // .................. get image .............................
    async getUserImage(req, res) {
        try {
          const {id} = req.params
    
            await User.findOne(
              { _id: id }
            )
              .then((result) => {
                if(result.image){
                return res.status(200).send({
                  success: true,
                  data: { message: "Image found",
                            image: result.image
                   },
                });}
                else{
                    return res.status(200).send({
                        success: true,
                        data: { message: "Image not found",
                                  image: null
                         },
                      });
                }
              })
              .catch((err) => {
                return res
                  .status(400)
                  .send({ success: false, data: { error: err.message } });
              });
        } catch (error) {
          return res.status(404).send({
            success: false,
            data: { error: error.response },
          });
        }
      },

        // .................. get user .............................
    async getUser(req, res) {
        try {
          const {id} = req.params

          await User.createIndexes([{ key: { email: 1 }, unique: true }]);

          let query
              if (id) {
                query = { _id: id, ...req.body };
              } else {
                query = { ...req.body };
              }
    
            await User.find(query)
              .then((result) => {
                return res.status(200).send({
                  success: true,
                  data: { message: "User found",
                            user: result
                   },
                });
              })
              .catch((err) => {
                return res
                  .status(400)
                  .send({ success: false, data: { error: err.message } });
              });
        } catch (error) {
          console.log(error)
          return res.status(404).send({
            success: false,
            data: { error: error.response },
          });
        }
      },

        // .................. update user .............................
    async updateUser(req, res) {
        try {
          const {id} = req.params
          if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            req.body.password = await bcrypt.hash(req.body.password, salt);
          }
    
            await User.findOneAndUpdate(
              { _id: id },
              req.body
            )
              .then((result) => {
                return res.status(200).send({
                  success: true,
                  data: { message: "User updated successfully"
                   },
                });
              })
              .catch((err) => {
                return res
                  .status(400)
                  .send({ success: false, data: { error: err.message } });
              });
        } catch (error) {
          return res.status(404).send({
            success: false,
            data: { error: error.response },
          });
        }
      },
};

module.exports = userController;

// router.post("/login", async (req, res) => {
// });
