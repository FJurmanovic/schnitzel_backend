const express = require("express");
const { check, validationResult} = require("express-validator");
const router = express.Router();

const jwt = require("jsonwebtoken");

const Post = require("../model/Post");
const User = require("../model/User");

const auth = require("../middleware/post");
const user = require("../middleware/auth");

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
                type: "post",
                content,
                userId
            });

            post.createdAt = new Date();

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
      res.send({ message: "Error in fetching post" });
    }
  });


router.get("/home", auth, async (req, res) => {
    try {

        await Post.find({}).sort({createdAt: -1}).exec(function(err, posts){
            var postMap = {};

            posts.forEach(async function(post, key) {
                var thisPost = {};
                let user = await User.findById(pst.userId);
                    if(user == null){
                        user= {"username": "DeletedUser"}
                    }
                thisPost["id"] = post._id;
                thisPost["title"] = post.title;
                thisPost["content"] = post.content;
                thisPost["userId"] = post.userId;
                thisPost["username"] = user.username;
                thisPost["createdAt"] = post.createdAt;
                postMap[key] = thisPost;
                if (key == posts.length-1){
                    res.json(postMap);
                }
            });

            

            //res.send(postMap);
                
        });
    } catch (e) {
        res.send({ message: "Error in fetching posts" })
    }
});

router.get("/scroll", user, async (req, res) => {
    const { current, fit, lastDate, lastId } = req.query;

    try {
        if((lastDate == '' || !lastDate) || (lastId == '' || !lastId)){
            const post = await Post.find({}).sort({createdAt: -1}).limit(parseInt(fit));

            var postMap = {};

            let i = 0;
            post.map(async function(pst, key) {
                console.log(pst)
                var thisPost = {};
                let user = await User.findById(pst.userId);
                    if(user == null){
                        user = {"username": "DeletedUser"}
                    }
                let isFollowing = await User.findById(req.user.id)
                let check = isFollowing.following.map(follower => follower.userId == user.id)[0]
                
                if (check || req.user.id == pst.userId || user.username == "DeletedUser"){
                    thisPost["id"] = pst._id;
                    thisPost["title"] = pst.title;
                    thisPost["content"] = pst.content;
                    thisPost["userId"] = pst.userId;
                    thisPost["username"] = user.username;
                    thisPost["createdAt"] = pst.createdAt;
                    postMap[pst._id] = thisPost;
                }
                if (i == post.length-1){
                    res.json({post: postMap, last: false});
                }
                i++;
            });

            //res.send({post, last: false});
        }else{
            const postNew = await Post.find( { $or:[{ createdAt: { $lt: lastDate }}, { $and:[{createdAt: { $eq: lastDate}}, {_id: {$ne: lastId}}]}] } )
            .sort({createdAt: -1});

            if (postNew.length < fit){
                const post = await Post.find( { $or:[{ createdAt: { $lt: lastDate }}, { $and:[{createdAt: { $eq: lastDate}}, {_id: {$ne: lastId}}]}] } )
                .sort({createdAt: -1}).limit(postNew.length);
                
                
                var postMap = {};
                let i = 0;
                post.forEach(async function(pst, key) {
                    var thisPost = {};
                    let user = await User.findById(pst.userId);
                    if(user == null){
                        user = {"username": "DeletedUser"}
                    }
                    let isFollowing = await User.findById(req.user.id)
                    let check = isFollowing.following.map(follower => follower.userId == user.id)[0]
                    
                    if (check || req.user.id == pst.userId || user.username == "DeletedUser"){
                        thisPost["id"] = pst._id;
                        thisPost["title"] = pst.title;
                        thisPost["content"] = pst.content;
                        thisPost["userId"] = pst.userId;
                        thisPost["username"] = user.username;
                        thisPost["createdAt"] = pst.createdAt;
                        postMap[pst._id] = thisPost;
                    }
                    if (i == post.length-1){
                        res.json({post: postMap, last: false});
                    }
                    i++;
                });
                
            }else{
                const post = await Post.find( { $or:[{ createdAt: { $lt: lastDate }}, { $and:[{createdAt: { $eq: lastDate}}, {_id: {$ne: lastId}}]}] } )
                .sort({createdAt: -1}).limit(parseInt(fit));
                
                
                var postMap = {};
                let i = 0;
                post.forEach(async function(pst, key) {
                    var thisPost = {};
                    let user = await User.findById(pst.userId);
                    if(user == null){
                        user = {"username": "DeletedUser"}
                    }
                    let isFollowing = await User.findById(req.user.id)
                    let check = isFollowing.following.map(follower => follower.userId == user.id)[0]
                    
                    if (check || req.user.id == pst.userId || user.username == "DeletedUser"){
                        thisPost["id"] = pst._id;
                        thisPost["title"] = pst.title;
                        thisPost["content"] = pst.content;
                        thisPost["userId"] = pst.userId;
                        thisPost["username"] = user.username;
                        thisPost["createdAt"] = pst.createdAt;
                        postMap[pst._id] = thisPost;
                    }
                    if (i == post.length-1){
                        res.json({post: postMap, last: false});
                    }
                    i++;
                });
            }
        }
    } catch (e) {
        res.send({ message: "Error in fetchin posts" })
    }
});

router.get("/removePost", user, async (req, res) => {
    const { idPost } = req.query;
    try {
      const post = await Post.findById(idPost);
      if(!(!post) && (post.userId == req.user.id)){
        const removePost = await Post.findByIdAndRemove(idPost);
        res.json("Removed post");
      }else{
        res.send("Not your post");
      }
      
    } catch(e) {
        res.send({ message: "Error in fetchin posts" })
    }
  });

router.get("/scrollProfile", async (req, res) => {
    const { userId, fit, lastDate, lastId } = req.query;

    try {
        if((lastDate == '' || !lastDate) || (lastId == '' || !lastId)){
            const post = await Post.find({userId: userId}).sort({createdAt: -1}).limit(parseInt(fit));

            var postMap = {};
            let i = 0;
            post.forEach(async function(pst, key) {
                var thisPost = {};
                let user = await User.findById(pst.userId);
                    if(user == null){
                        user= {"username": "DeletedUser"}
                    }
                thisPost["id"] = pst._id;
                thisPost["title"] = pst.title;
                thisPost["content"] = pst.content;
                thisPost["userId"] = pst.userId;
                thisPost["username"] = user.username;
                thisPost["createdAt"] = pst.createdAt;
                postMap[key] = thisPost;
                if (i == post.length-1){
                    res.json({post: postMap, last: false});
                }
                i++
            });

            //res.send({post, last: false});
        }else{
            const postNew = await Post.find( { $and:[{$or:[{ createdAt: { $lt: lastDate }}, { $and:[{createdAt: { $eq: lastDate}}, {_id: {$ne: lastId}}]}]}, {userId: userId}] } )
            .sort({createdAt: -1});

            if (postNew.length < fit){
                console.log("Dada")
                const post = await Post.find( { $and:[{$or:[{ createdAt: { $lt: lastDate }}, { $and:[{createdAt: { $eq: lastDate}}, {_id: {$ne: lastId}}]}]}, {userId: userId}] } )
                .sort({createdAt: -1}).limit(postNew.length);
                
                
                var postMap = {};
                let i = 0;
                post.forEach(async function(pst, key) {
                    var thisPost = {};
                    let user = await User.findById(pst.userId);
                    if(user == null){
                        user= {"username": "DeletedUser"}
                    }
                    thisPost["id"] = pst._id;
                    thisPost["title"] = pst.title;
                    thisPost["content"] = pst.content;
                    thisPost["userId"] = pst.userId;
                    thisPost["username"] = user.username;
                    thisPost["createdAt"] = pst.createdAt;
                    postMap[key] = thisPost;
                    if (i == post.length-1){
                        res.json({post: postMap, last: true});
                    }
                    i++;
                });
                
            }else{
                const post = await Post.find( { $and:[{$or:[{ createdAt: { $lt: lastDate }}, { $and:[{createdAt: { $eq: lastDate}}, {_id: {$ne: lastId}}]}]}, {userId: userId}] } )
                .sort({createdAt: -1}).limit(parseInt(fit));
                
                
                var postMap = {};
                let i = 0;
                post.forEach(async function(pst, key) {
                    var thisPost = {};
                    let user = await User.findById(pst.userId);
                    if(user == null){
                        user= {"username": "DeletedUser"}
                    }
                    thisPost["id"] = pst._id;
                    thisPost["title"] = pst.title;
                    thisPost["content"] = pst.content;
                    thisPost["userId"] = pst.userId;
                    thisPost["username"] = user.username;
                    thisPost["createdAt"] = pst.createdAt;
                    postMap[key] = thisPost;
                    if (i == post.length-1){
                        res.json({post: postMap, last: false});
                    }
                    i++
                });
            }
        }
    } catch (e) {
        res.send({ message: "Error in fetchin posts" })
    }
});

module.exports = router;
