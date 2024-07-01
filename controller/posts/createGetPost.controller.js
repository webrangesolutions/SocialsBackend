const Post = require("../../models/post.model");
const User = require("../../models/user.model");

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

async getSearchedItems(req, res) {
  try {
    const pipeline = [
      {
        $lookup: {
          from: "users", // The collection to join
          localField: "userId", // The field from the input documents
          foreignField: "_id", // The field from the documents of the "from" collection
          as: "user", // Output array field
        },
      },
      {
        $unwind: "$user", // Deconstructs the array field from the lookup stage
      },
      {
        $unwind: {
          path: "$mention",
          preserveNullAndEmptyArrays: true, // If there are no mentions, keep the document
        },
      },
      {
        $unwind: {
          path: "$tags",
          preserveNullAndEmptyArrays: true, // If there are no tags, keep the document
        },
      },
      {
        $group: {
          _id: null,
          uniqueAreas: { $addToSet: "$area" },
          uniqueMentions: { $addToSet: "$mention" },
          uniqueTags: { $addToSet: "$tags" },
          usernames: { $addToSet: "$user.name" },
          totalPosts: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          uniqueAreas: {
            $filter: {
              input: "$uniqueAreas",
              as: "area",
              cond: { $ne: ["$$area", null] },
            },
          },
          uniqueMentions: {
            $filter: {
              input: "$uniqueMentions",
              as: "mention",
              cond: { $ne: ["$$mention", null] },
            },
          },
          uniqueTags: {
            $filter: {
              input: "$uniqueTags",
              as: "tag",
              cond: { $ne: ["$$tag", null] },
            },
          },
          usernames: 1,
          totalPosts: 1,
        },
      },
    ];

    const result = await Post.aggregate(pipeline).exec();

    return res.status(200).send({
      success: true,
      data: {
        message: "Post Found",
        ...result[0],
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error); // Log any errors that occur
    res.status(500).json({ success: false, message: error.message });
  }
},

async getUserPostWithTime(req, res) {
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
              mention: "$mention",
              tags: "$tags"
            }
          }
        }
      },
      {
        $sort: {
          '_id.year': -1,
          '_id.month': -1,
          '_id.day': -1,
          '_id.hour': -1
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

async searchPost(req, res) {
  const { area, mention, tags, username } = req.params;

  console.log( ".. params tags ...", req.params)

  try {
    // Initialize the query object
    let query = {};

    // Add filters to the query object if they exist in the request parameters
    if (area && area != 'false') {query.area = area};
    if (mention && mention != 'false') query.mention = { $in: mention.split(",") };
    if (tags && tags != 'false') query.tags = { $in: tags.split(",") };
    if (username && username != 'false') {
      const users = await User.find({ name: new RegExp(username, 'i') });
      const userIds = users.map(user => user._id);
      query.userId = { $in: userIds };
    }
    let idCounter = 1; 

    // Aggregate posts based on the query
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
              mention: "$mention",
              tags: "$tags"
            }
          }
        }
      },
      {
        $sort: {
          '_id.year': -1,
          '_id.month': -1,
          '_id.day': -1,
          '_id.hour': -1
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

    res.status(200).json({
      success: true,
      data: {
        message: 'Posts Found',
        totalPosts: results.length,
        posts: results
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
