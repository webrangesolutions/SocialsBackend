const Post = require("../../models/post.model");

const postController = {
  async createPost(req, res, next) {
      
    try {
      let postData = req.body;
      postData.video = req.fileUrl;
      postData.thumbnail = req.thumbnailUrl;
  
      const post = new Post(postData);
  
      const registeredPost = await post.save();
      res.status(200).send({
        message: "Post created successfully",
        data: registeredPost
      });
    } catch (error) {
      next(error);  // Pass the error to the next middleware
    }
  },

  async getUserPost(req, res) {
      
    let {id} = req.params
    
      try {
        let query
        if (id) {
          query = { userId: id, ...req.body };
        } else {
          query = { ...req.body };
        }

        await Post.find(query)
          .then((result) => {
            return res.status(200).send({
              success: true,
              data: { message: "Post Found",
                    totalPosts: result.length,
                    posts : result
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

async  getUserPostWithTime(req, res) {
  let { id } = req.params;

  try {
    let query;
    if (id) {
      query = { userId: id, ...req.body };
    } else {
      query = { ...req.body };
    }

    console.log('Query:', query); // Log the query to see what's being passed

    let idCounter = 1; // Initialize a counter for the id

    const results = await Post.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' },
            hour: { $hour: '$date' }
          },
          totalPosts: { $sum: 1 },
          posts: {
            $push: {
              _id: '$_id',
              video: '$video',
              date: '$date',
              thumbnail: '$thumbnail',
            }
          }
        }
      },
      {
        $addFields: {
          id: { $toString: idCounter++ } // Increment idCounter for each group
        }
      },
      {
        $project: {
          _id: 0,
          id: 1,
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: '$_id.day'
                }
              }
            }
          },
          time: {
            $dateToString: {
              format: '%H:%M',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: '$_id.day',
                  hour: '$_id.hour'
                }
              }
            }
          },
          totalPosts: 1,
          posts: 1
        }
      }
    ]);

    console.log('Results:', results); // Log the results to see what's returned

    res.status(200).json({
      success: true,
      data: {
        message: 'Posts Found',
        totalGroups: results.length,
        groups: results
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error); // Log any errors that occur
    res.status(500).json({ success: false, message: error.message });
  }
},

async proxyController(req, res) {
  try {
    const videoUrl = req.query.url; // Assuming url is passed as a query parameter
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch video');
    }
    const videoBlob = await response.blob();
    res.setHeader('Content-Type', response.headers.get('Content-Type'));
    res.send(videoBlob);
  } catch (error) {
    console.error('Error proxying video:', error);
    res.status(500).send({ error: 'Failed to proxy video' });
  }
}
  
};

module.exports = postController;

// router.post("/login", async (req, res) => {
// });
