const express = require("express");
const { check, validationResult} = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();

const mongoose = require("mongoose");

const User = require("../model/User");
const Post = require("../model/Post");
const auth = require("../middleware/auth");

let errRoute = {};



router.post(
    "/signup",
    [
        check("username", "Please Enter a Valid Username") //Checks if "username" request is empty
        .not()
        .isEmpty()
        .isLength({
          min: 2,
          max: 10
        }),
        check("email", "Please enter a valid email").isEmail(), //Checks if "email" request is email
        check("password", "Please enter a valid password").isLength({ //Checks if "password" request is smaller than 6 characters
            min: 6
        })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json(errors);
        }

        const {
            username,
            email,
            password,
            isPrivate
        } = req.body; //Variables from request's body
        try {
            let user = await User.findOne({ //If email exists in database, it will return true
                email 
            });
            if (user) {
                return res.status(400).json({ //It will send respond that email already exists
                    type: "email",
                    message: "Email is already registred"
                });
            }

            user = await User.findOne({ 
                username
            });
            if (user) {
                return res.status(400).json({
                    type: "username",
                    message: "Username is already registred"
                });
            }

            user = new User({ //If everything checks right, it will add new user to database
                username,
                email,
                password,
                isPrivate
            });

            
            user.createdAt = new Date();
            user.updatedAt = new Date();

            const salt = await bcrypt.genSalt(10); //Adds random characters(salt) 
            user.password = await bcrypt.hash(password, salt); //Encrypts password + salt

            await user.save();

            const payload = {
                user: {
                    id: user.id
                }
            };

            jwt.sign(
                payload,
                "randomString", {
                    expiresIn: 10000
                },
                (err, token) => {
                    if (err) throw err;
                    res.status(200).json({ //Sends back token that rest of the backend uses for authentication
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
    "/login",
    [
      check("email", "Please enter a valid email").isEmail(), //Checks if email
      check("password", "Please enter a valid password").isLength({ //Checks if >6
        min: 6
      })
    ],
    async (req, res) => {
      const errors = validationResult(req);
  
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array()
        });
      }
  
      const { email, password } = req.body; //Variables from request body sent by frontend
      try {
        let user = await User.findOne({ //Checks if email exists
          email
        });
        if (!user)
          return res.status(400).json({ //If not, sends message
            type: "email",
            message: "User does not exist"
          });
  
        const isMatch = await bcrypt.compare(password, user.password); //decrypts and compares if passwords match
        if (!isMatch)
          return res.status(400).json({
            type: "password",
            message: "Incorrect Password!"
          });
  
        const payload = {
          user: {
            id: user.id
          }
        };
  
        jwt.sign(
          payload,
          "secret",
          {
            expiresIn: 3600
          },
          (err, token) => {
            if (err) throw err;
            res.status(200).json({
              token //Sends token used for login and backend auth
            });
          }
        );
        errRoute = errors;
      } catch (e) {
        console.error(e);
        res.status(500).json({
          message: "Server Error"
        });
      }
    }
);

router.post(
  "/edit", auth, //Uses middleware that checks token and returns user id
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    const { email, username, password, isPrivate, id, hasPhoto, photoExt } = req.body;
    try {
      //console.log(req.body)
      if(req.user.id == "5ed4ce7841cc3c001cfa6bfb"){
        res.send({
          type: "demo",
          message: "You cannot edit demo account"
        })
        return
      }

      if(id != req.user.id){
        res.send({message: "Invalid account"});
      }
      
      if('email' in req.body){
        let user = await User.findOne({
          email
        });
        if (user) {
            return res.status(400).json({
                type: "email",
                message: "Email is already registred"
          });
        } else {
          User.findByIdAndUpdate(id, {email: email, updatedAt: Date()}, function(err, ress){ //Updates user email in database 
            if(err) {
              return res.status(400).json({
                type: "email",
                message: err
              });
            }else{
              //console.log(ress)
            }
          })
        }
      }
      
      if('username' in req.body){
        user = await User.findOne({
            username
        });
        if (user) {
            return res.status(400).json({
                type: "username",
                message: "Username is already registred"
          });
        } else {
          User.findByIdAndUpdate(id, {username: username, updatedAt: Date()}, function(err, ress){ //Updates user username in database
            if(err) {
              return res.status(400).json({
                type: "username",
                message: err
              });
            }else{
              //console.log(ress)
            }
          })
        }
      }
      if ('password' in req.body){
        const salt = await bcrypt.genSalt(10);
        const hashpassword = await bcrypt.hash(password, salt);
        User.findByIdAndUpdate(id, {password: hashpassword, updatedAt: Date()}, function(err, ress){ //Updates password of user in database
          if(err) {
            return res.status(400).json({
              type: "email",
              message: err
            });
          }else{
            //console.log(ress)
          }
        })
      }
      if ('isPrivate' in req.body){
        User.findByIdAndUpdate(id, {isPrivate: isPrivate, updatedAt: Date()}, function(err, ress){ //Updates privacy of user
          if(err) {
            return res.status(400).json({
              type: "privacy",
              message: err
            });
          }else{
            //console.log(ress)
          }
        })
      }
      if ('hasPhoto' in req.body){
        User.findByIdAndUpdate(id, {hasPhoto: hasPhoto, photoExt: photoExt, updatedAt: Date()}, function(err, ress){ //Updates if photo is uploaded
          if(err) {
            return res.status(400).json({
              type: "photo",
              message: err
            });
          }else{
            //console.log(ress)
          }
        })
      }

      const payload = {
        user: {
          id: id
        }
      };

      jwt.sign(
        payload,
        "secret",
        {
          expiresIn: 3600
        },
        (err, token) => {
          if (err) throw err;
          res.status(200).json({
            token
          });
        }
      );

    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: "Server Error"
      });
    }
  }
);

router.get("/data", auth, async (req, res) => { //Sending the user data to frontend
    try {
      const user = await User.findById(req.user.id);
      let userData = {};
      userData["id"] = user._id;
      userData["username"] = user.username;
      userData["email"] = user.email;
      userData["createdAt"] = user.createdAt;
      userData["isPrivate"] = user.isPrivate;
      userData["hasPhoto"] = user.hasPhoto || false;
      userData["photoExt"] = user.photoExt || '';

      let { following, followers } = user;

      //console.log(following)
      let newFollowing = []
      if(following.length > 0){ //Enters if user has any following users
        following.forEach(async function(resp, key){
          const userr = await User.findById(resp.userId); //Adding current username's from followerId's 
          if(!(userr === null)){ 
            newFollowing[key] = {
              "userId": resp.userId,
              "username": userr.username
            };
          }
          if (key == following.length-1){
            userData["following"] = newFollowing;
            let newFollowers = []
            if(followers.length > 0){
              followers.forEach(async function(respp, keyy){
                const userrr = await User.findById(respp.userId);
                if(!(userrr === null)){ 
                  newFollowers[keyy] = {
                    "userId": respp.userId,
                    "username": userrr.username
                  };
                }
                if (keyy == followers.length-1){
                  userData["followers"] = newFollowers;
                  res.json(userData)
                }
              });
            } else {
              userData["followers"] = []
              res.json(userData);
            }
          }
        })

      }else if(followers.length > 0){ //Enters if user doesn't have following users but has followers
        let newFollowers = []
        followers.forEach(async function(respp, keyy){
          const userrr = await User.findById(respp.userId);
          if(!(userrr === null)){ 
            newFollowers[keyy] = {
              "userId": respp.userId,
              "username": userrr.username
            };
          }
          if (keyy == followers.length-1){
            userData["followers"] = newFollowers;
            userData["following"] = [];
            res.json(userData)
          }
        });
      } else { //Else gives them empty lists
        userData["followers"] = [];
        userData["following"] = [];
        res.json(userData)
      }
    } catch (e) {
      res.json({ 
        type: "fetch",
        message: "Error in Fetching user" 
      });
    }
});

router.get("/dataByUser", auth, async (req, res) => { //Responds with data from username
  try {
    const user = await User.findOne({username: req.headers.username});
    const profile = await User.findById(req.user.id)
    const postNum = (await Post.find({userId: user._id })).length

    const isFollowing = profile.following.filter(x => x.userId == user._id).map(x => x.userId == user._id)[0] || false

    let userData = {};
    userData["id"] = user._id;
    userData["hasPhoto"] = user.hasPhoto;
    userData["photoExt"] = user.photoExt;
    userData["username"] = user.username;
    userData["isFollowing"] = isFollowing;
    userData["postNum"] = postNum;
    userData["isPrivate"] = user.isPrivate;
    userData["createdAt"] = user.createdAt;
    res.json(userData);
  } catch (e) {
    res.json({ 
      type: "fetch",
      message: "Error in Fetching user" 
    });
  }
});

router.get("/getUser", async (req, res) => { //Responds with username from userId
    try {
      const user = await User.findById(req.headers.id);
      res.json(user.username);
    } catch (e) {
      res.json({ 
        type: "fetch",
        message: "Error in fetching user" 
      });
    }
});

router.get("/follow", auth, async (req, res) => { //Adds following to user if not already following, and followers to outher user 
  const { idUser, id } = req.query;
  try {
    const user = await User.findOne({following: {userId: id}});
    if(!user){
      const newFollowing = await User.findById(idUser);
      const newFollower = await User.findById(id);

      if (!!newFollowing && !!newFollower){
        await User.findByIdAndUpdate(idUser, { $push: { following: { "userId": id } } });
        await User.findByIdAndUpdate(id, { $push: { followers: { "userId": idUser } } });
      }
      res.json("Added followers");
    }else{
      res.send("Already following");
    }
    
  } catch {

  }
});

router.get("/unfollow", auth, async (req, res) => { //Removes following from user, and followers from other user
  const { idUser, id } = req.query;
  try {
    const user = await User.findById(idUser);
    if(!(!user)){

      const newFollowing = await User.findById(idUser);
      const newFollower = await User.findById(id);

      if(!!newFollowing && !!newFollower){
        await User.findByIdAndUpdate(idUser, { $pull: { following: { "userId": id } } });
        await User.findByIdAndUpdate(id, { $pull: { followers: { "userId": idUser } } });
      }
      res.json("Removed followers");
    }else{
      res.send("Not following");
    }
    
  } catch {

  }
});

router.post("/getFollowerUsernames", auth, async (req, res) => { //Gets followers and following from user id
  let { id } = req.body;

  try {
    const user = await User.findById(id);
    let userData = {};

    let { following, followers } = user;

    //console.log(following)
    let newFollowing = []
    if(following.length > 0){
      following.forEach(async function(resp, key){
        const userr = await User.findById(resp.userId);
        if(!(userr === null)){ 
          newFollowing[key] = {
            "userId": resp.userId,
            "username": userr.username
          };
        }
        if (key == following.length-1){
          userData["following"] = newFollowing;
          let newFollowers = []
          if(followers.length > 0){
            followers.forEach(async function(respp, keyy){
              const userrr = await User.findById(respp.userId);
              if(!(userrr === null)){ 
                newFollowers[key] = {
                  "userId": respp.userId,
                  "username": userrr.username
                };
              }
              if (keyy == followers.length-1){
                userData["followers"] = newFollowers;
                res.json(userData)
              }
            });
          } else {
            res.json(userData);
          }
        }
      })

    }else if(followers.length > 0){
      let newFollowers = []
      followers.forEach(async function(respp, keyy){
        const userrr = await User.findById(respp.userId);
        if(!(userrr === null)){ 
          newFollowers[keyy] = {
            "userId": respp.userId,
            "username": userrr.username
          };
        }
        if (keyy == followers.length-1){
          userData["followers"] = newFollowers;
          userData["following"] = [];
          res.json(userData)
        }
      });
    } else {
      userData["followers"] = [];
      userData["following"] = [];
      res.json(userData)
    }
  } catch (e) {
    res.json({ 
      type: "fetch",
      message: "Error in Fetching user" 
    });
  }
});

router.get("/deactivate", auth, async (req, res) => { //Deactivates user (deletes it from database)
    try {
      if(req.user.id != "5ed4ce7841cc3c001cfa6bfb"){
        const user = await User.findByIdAndDelete(req.user.id);
        res.send("Succesfully deactivated")
      }else{
        res.send({
          "type": "deactivate",
          "message": "You cannot deactivate demo account"
        })
        return
      }
    } catch (e) {
      res.json({ 
        type: "deleting",
        message: "Error in deleting user" 
      });
    }
});

router.get("/err", async (req, res) => {
  try {
    res.json(errRoute);
  } catch (e) {
    res.json({ message: 'Error'});
  }
});
  

module.exports = router;