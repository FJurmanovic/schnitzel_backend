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
        check("description", "Please enter a valid description").not()
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
            type,
            description,
            categories,
            userId,
            ingredients,
            directions
        } = req.body;
        try {
            let points = [];
            if(type === "post"){
                post = new Post({
                    title,
                    type,
                    description,
                    categories,
                    points,
                    userId
                });
            }else if(type === "recipe"){
                post = new Post({
                    title,
                    type,
                    description,
                    categories,
                    points,
                    userId,
                    ingredients,
                    directions
                })
            }
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

router.post(
    "/newComment",
    [
        check("comment", "Please enter a valid comment").not()
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
            postId,
            comment,
            userId
        } = req.body;
        try {
            let points = [];

            if('commentId' in req.body){
                const { commentId } = req.body;

                await Post.updateOne({_id: postId, 'comments._id': commentId}, { $addToSet: { 'comments.$.reply': {"userId": userId, "comment": comment, "points": points} } });
                
                res.send("Added reply")

            }else{
                await Post.findByIdAndUpdate(postId, { $push: { comments: {"userId": userId, "comment": comment, "points": points}}})
                
                res.send("Added comment")
            }
                
            res.send("Comment not added")


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

router.get("/addPoint", user, async (req, res) => {
    try {
        if(req.query.type == "post"){
            await Post.findByIdAndUpdate(req.query.id, { $push: { points: {"userId": req.user.id}}})
        }else if(req.query.type == "comment"){
            await Post.updateOne({_id: req.query.id, 'comments._id': req.query.commentId}, { $addToSet: { 'comments.$.points': {"userId": req.user.id} } });
        }else if(req.query.type == "reply"){
            await Post.findByIdAndUpdate({_id: req.query.id}, { $addToSet: { 'comments.$[comment].reply.$[repl].points': {"userId": req.user.id} } }, { arrayFilters: [{ 'comment._id': req.query.commentId }, { 'repl._id': req.query.replyId }] })
            //await Post.updateOne({_id: req.query.id, 'comments._id': req.query.commentId, 'comments.$.reply._id': req.query.replyId }, { $addToSet: { 'comments.$.reply.0.points': {"userId": req.user.id } } })
        }
        
        res.send("Added point")
    } catch (e) {
        res.send({ message: "Error in fetching post" });
    }
})

router.get("/removePoint", user, async (req, res) => {
    try {
        if(req.query.type == "post"){
            await Post.findByIdAndUpdate(req.query.id, { $pull: { points: {"userId": req.user.id}}})
        }else if(req.query.type == "comment"){
            await Post.updateOne({_id: req.query.id, 'comments._id': req.query.commentId}, { $pull: { 'comments.$.points': {"userId": req.user.id} }})
        }else if(req.query.type == "reply"){
            await Post.findByIdAndUpdate({_id: req.query.id}, { $pull: { 'comments.$[comment].reply.$[repl].points': {"userId": req.user.id} } }, { arrayFilters: [{ 'comment._id': req.query.commentId }, { 'repl._id': req.query.replyId }] })
        }
        res.send("Removed point")
    } catch (e) {
        res.send({ message: "Error in fetching post" });
    }
})

router.get("/getPost", user, async (req, res) => {
    try {
            const post = await Post.findById(req.query.id)
            let user = await User.findById(post.userId);
                    if(user == null){
                        user = {"username": "DeletedUser"}
                    }
            let isFollowing = await User.findById(req.user.id)
            let check = isFollowing.following.map(follower => follower.userId == user.id)[0]
            let isPointed = post.points.map(x => x.userId == req.user.id)[0] || false
            
            let postMap = {};
        
            postMap["id"] = post._id;
            postMap["title"] = post.title;
            postMap["type"] = post.type;
            postMap["description"] = post.description;
            postMap["isPointed"] = isPointed;
            postMap["points"] = post.points;
            postMap["categories"] = post.categories;
            if(post.type == "recipe"){
                postMap["ingredients"] = post.ingredients;
                postMap["directions"] = post.directions;
            }
            postMap["userId"] = post.userId;
            postMap["username"] = user.username;
            postMap["createdAt"] = post.createdAt;
            postMap["comments"] = [];

            let comments = post.comments;
            let newComments = [];
            for(let comment of comments){
                let newComment = {};
                let userInComment = await User.findById(comment.userId);
                    if(userInComment == null){
                        userInComment = {"username": "DeletedUser"}
                    }
                let isCommentPointed = comment.points.map(x => x.userId == req.user.id)[0] || false
                    
                newComment["id"] = comment.id,
                newComment["comment"] = comment.comment,
                newComment["createdAt"] = comment.createdAt,
                newComment["isPointed"] = isCommentPointed,
                newComment["points"] = comment.points,
                newComment["reply"] = [];
                for(let reply of comment.reply){
                    let newReply = {};
                    let userInReply = await User.findById(reply.userId);
                    if(userInReply == null){
                        userInReply = {"username": "DeletedUser"}
                    }
                    let isReplyPointed = reply.points.map(x => x.userId == req.user.id)[0] || false
                    newReply["id"] = reply.id,
                    newReply["comment"] = reply.comment,
                    newReply["createdAt"] = reply.createdAt,
                    newReply["isPointed"] = isReplyPointed,
                    newReply["points"] = reply.points;
                    newReply["userId"] = reply.userId,
                    newReply["username"] = userInReply.username;
                    newComment["reply"].push(newReply);
                }
                newComment["userId"] = comment.userId,
                newComment["username"] = userInComment.username;
                postMap["comments"].push(newComment);
            }

            res.json({post: postMap});
            
    } catch (e) {
        res.send({ message: "Error in fetching posts" })
    }
});

router.get("/scroll", user, async (req, res) => {
    const { current, fit, lastDate, lastId } = req.query;

    try {
        if((lastDate == '' || !lastDate) || (lastId == '' || !lastId)){
            const post = await Post.find({}).sort({createdAt: -1}).limit(parseInt(fit));

            var postMap = [];

            let i = 0;
            for(const pst of post){
                //console.log(pst)
                var thisPost = {};
                let user = await User.findById(pst.userId);
                    if(user == null){
                        user = {"username": "DeletedUser"}
                    }
                let isFollowing = await User.findById(req.user.id)
                let check = isFollowing.following.map(follower => follower.userId == user.id)[0]

                let isPointed = pst.points.map(x => x.userId == user.id)[0] || false
                
                if (check || req.user.id == pst.userId || user.username === "DeletedUser"){
                    thisPost["id"] = pst._id;
                    thisPost["title"] = pst.title;
                    thisPost["type"] = pst.type;
                    thisPost["description"] = pst.description;
                    thisPost["points"] = pst.points;
                    thisPost["isPointed"] = isPointed;
                    thisPost["categories"] = pst.categories;
                    thisPost["userId"] = pst.userId;
                    if(pst.type == "recipe"){
                        thisPost["ingredients"] = pst.ingredients;
                        thisPost["directions"] = pst.directions;
                    }
                    thisPost["username"] = user.username;
                    thisPost["createdAt"] = pst.createdAt;
                    postMap.push(thisPost);
                }
                if (i == post.length-1){
                    res.json({post: postMap, last: false});
                }
                i++;
            };

            //res.send({post, last: false});
        }else{
            const postNew = await Post.find( { $or:[{ createdAt: { $lt: lastDate }}, { $and:[{createdAt: { $eq: lastDate}}, {_id: {$ne: lastId}}]}] } )
            .sort({createdAt: -1});

            if (postNew.length < fit){
                const post = await Post.find( { $or:[{ createdAt: { $lt: lastDate }}, { $and:[{createdAt: { $eq: lastDate}}, {_id: {$ne: lastId}}]}] } )
                .sort({createdAt: -1}).limit(postNew.length);
                
                
                var postMap = [];
                let i = 0;
                for(const pst of post){
                    var thisPost = {};
                    let user = await User.findById(pst.userId);
                    if(user == null){
                        user = {"username": "DeletedUser"}
                    }
                    let isFollowing = await User.findById(req.user.id)
                    let check = isFollowing.following.map(follower => follower.userId == user.id)[0]
                    
                    if (check || req.user.id == pst.userId || user.username === "DeletedUser"){
                        thisPost["id"] = pst._id;
                        thisPost["title"] = pst.title;
                        thisPost["type"] = pst.type;
                        thisPost["description"] = pst.description;
                        thisPost["points"] = pst.points;
                        thisPost["categories"] = pst.categories;
                        if(pst.type == "recipe"){
                            thisPost["ingredients"] = pst.ingredients;
                            thisPost["directions"] = pst.directions;
                        }
                        thisPost["userId"] = pst.userId;
                        thisPost["username"] = user.username;
                        thisPost["createdAt"] = pst.createdAt;
                        postMap.push(thisPost);
                    }
                    if (i == post.length-1){
                        res.json({post: postMap, last: false});
                    }
                    i++;
                };
                
            }else{
                const post = await Post.find( { $or:[{ createdAt: { $lt: lastDate }}, { $and:[{createdAt: { $eq: lastDate}}, {_id: {$ne: lastId}}]}] } )
                .sort({createdAt: -1}).limit(parseInt(fit));
                
                
                var postMap = [];
                let i = 0;
                for(const pst of post){
                    var thisPost = {};
                    let user = await User.findById(pst.userId);
                    if(user == null){
                        user = {"username": "DeletedUser"}
                    }
                    let isFollowing = await User.findById(req.user.id)
                    let check = isFollowing.following.map(follower => follower.userId == user.id)[0]
                    
                    if (check || req.user.id == pst.userId || user.username === "DeletedUser"){
                        thisPost["id"] = pst._id;
                        thisPost["title"] = pst.title;
                        thisPost["type"] = pst.type;
                        thisPost["description"] = pst.description;
                        thisPost["points"] = pst.points;
                        thisPost["categories"] = pst.categories;
                        if(pst.type == "recipe"){
                            thisPost["ingredients"] = pst.ingredients;
                            thisPost["directions"] = pst.directions;
                        }
                        thisPost["userId"] = pst.userId;
                        thisPost["username"] = user.username;
                        thisPost["createdAt"] = pst.createdAt;
                        postMap.push(thisPost);
                    }
                    if (i == post.length-1){
                        res.json({post: postMap, last: false});
                    }
                    i++;
                };
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

            var postMap = [];
            let i = 0;
            for(const pst of post){
                var thisPost = {};
                let user = await User.findById(pst.userId);
                    if(user == null){
                        user= {"username": "DeletedUser"}
                    }
                thisPost["id"] = pst._id;
                thisPost["title"] = pst.title;
                thisPost["type"] = pst.type;
                thisPost["description"] = pst.description;
                thisPost["points"] = pst.points;
                thisPost["categories"] = pst.categories;
                if(pst.type == "recipe"){
                    thisPost["ingredients"] = pst.ingredients;
                    thisPost["directions"] = pst.directions;
                }
                thisPost["userId"] = pst.userId;
                thisPost["username"] = user.username;
                thisPost["createdAt"] = pst.createdAt;
                postMap.push(thisPost);
                if (i == post.length-1){
                    res.json({post: postMap, last: false});
                }
                i++
            };

            //res.send({post, last: false});
        }else{
            const postNew = await Post.find( { $and:[{$or:[{ createdAt: { $lt: lastDate }}, { $and:[{createdAt: { $eq: lastDate}}, {_id: {$ne: lastId}}]}]}, {userId: userId}] } )
            .sort({createdAt: -1});

            if (postNew.length < fit){
                //console.log("Dada")
                const post = await Post.find( { $and:[{$or:[{ createdAt: { $lt: lastDate }}, { $and:[{createdAt: { $eq: lastDate}}, {_id: {$ne: lastId}}]}]}, {userId: userId}] } )
                .sort({createdAt: -1}).limit(postNew.length);
                
                
                var postMap = [];
                let i = 0;
                for(const pst of post){
                    var thisPost = {};
                    let user = await User.findById(pst.userId);
                    if(user == null){
                        user= {"username": "DeletedUser"}
                    }
                    thisPost["id"] = pst._id;
                    thisPost["title"] = pst.title;
                    thisPost["type"] = pst.type;
                    thisPost["description"] = pst.description;
                    thisPost["points"] = pst.points;
                    thisPost["categories"] = pst.categories;
                    if(pst.type == "recipe"){
                        thisPost["ingredients"] = pst.ingredients;
                        thisPost["directions"] = pst.directions;
                    }
                    thisPost["userId"] = pst.userId;
                    thisPost["username"] = user.username;
                    thisPost["createdAt"] = pst.createdAt;
                    postMap.push(thisPost);
                    if (i == post.length-1){
                        res.json({post: postMap, last: true});
                    }
                    i++;
                };
                
            }else{
                const post = await Post.find( { $and:[{$or:[{ createdAt: { $lt: lastDate }}, { $and:[{createdAt: { $eq: lastDate}}, {_id: {$ne: lastId}}]}]}, {userId: userId}] } )
                .sort({createdAt: -1}).limit(parseInt(fit));
                
                
                var postMap = [];
                let i = 0;
                for(const pst of post){
                    var thisPost = {};
                    let user = await User.findById(pst.userId);
                    if(user == null){
                        user= {"username": "DeletedUser"}
                    }
                    thisPost["id"] = pst._id;
                    thisPost["title"] = pst.title;
                    thisPost["type"] = pst.type;
                    thisPost["description"] = pst.description;
                    thisPost["points"] = pst.points;
                    thisPost["categories"] = pst.categories;
                    if(pst.type == "recipe"){
                        thisPost["ingredients"] = pst.ingredients;
                        thisPost["directions"] = pst.directions;
                    }
                    thisPost["userId"] = pst.userId;
                    thisPost["username"] = user.username;
                    thisPost["createdAt"] = pst.createdAt;
                    postMap.push(thisPost);
                    if (i == post.length-1){
                        res.json({post: postMap, last: false});
                    }
                    i++
                };
            }
        }
    } catch (e) {
        res.send({ message: "Error in fetchin posts" })
    }
});

module.exports = router;
