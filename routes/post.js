const express = require("express");
const { check, validationResult} = require("express-validator");
const router = express.Router();

const jwt = require("jsonwebtoken");

const Post = require("../model/Post");

const auth = require("../middleware/post");

router.post(
    "/create",
    [
        check("title", "Please Enter a Valid Title")
        .not()
        .isEmpty(),
        check("content", "Please enter a valid content").not()
        .isEmpty(),
        check("userId", "Invalid userId").not()
        .isEmpty(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json(errors);
        }

        const {
            title,
            content,
            userId
        } = req.body;
        try {
            post = new Post({
                title,
                content,
                userId
            });

            await post.save();

            const payload = {
                post: {
                    id: post.id
                }
            };

            jwt.sign(
                payload,
                "randomString", {
                    expiresIn: 10000
                },
                (err, token) => {
                    if (err) throw err;
                    res.status(200).json({
                        token
                    });
                }
            );

            errRoute = errors;
        } catch (err) {
            console.log(err.message);
            res.status(500).send("Error in Saving");
        }
    }
);

router.get("/data", auth, async (req, res) => {
    try {
      const post = await Post.findById(req.post.id);
      res.json(post);
    } catch (e) {
      res.send({ message: "Error in Fetching user" });
    }
  });

module.exports = router;
