const express = require("express");
const { check, validationResult} = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();

const mongoose = require("mongoose");

const User = require("../model/User");
const auth = require("../middleware/auth");

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

let errRoute = {};



router.post(
    "/signup",
    [
        check("username", "Please Enter a Valid Username")
        .not()
        .isEmpty(),
        check("email", "Please enter a valid email").isEmail(),
        check("password", "Please enter a valid password").isLength({
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
        } = req.body;
        try {
            let user = await User.findOne({
                email
            });
            if (user) {
                return res.status(400).json({
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

            user = new User({
                username,
                email,
                password,
                isPrivate
            });

            
            user.createdAt = new Date();
            user.updatedAt = new Date();

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

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
    "/login",
    [
      check("email", "Please enter a valid email").isEmail(),
      check("password", "Please enter a valid password").isLength({
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
  
      const { email, password } = req.body;
      try {
        let user = await User.findOne({
          email
        });
        if (!user)
          return res.status(400).json({
            type: "email",
            message: "User does not exist"
          });
  
        const isMatch = await bcrypt.compare(password, user.password);
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
              token
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
  "/edit",
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    const { email, username, password, isPrivate, id } = req.body;
    try {
      
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
          User.findByIdAndUpdate(id, {email: email, updatedAt: Date()}, function(err, ress){
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
          User.findByIdAndUpdate(id, {username: username, updatedAt: Date()}, function(err, ress){
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
        User.findByIdAndUpdate(id, {password: hashpassword, updatedAt: Date()}, function(err, ress){
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
        User.findByIdAndUpdate(id, {isPrivate: isPrivate, updatedAt: Date()}, function(err, ress){
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

router.get("/data", auth, async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      let userData = {};
      userData["id"] = user._id;
      userData["username"] = user.username;
      userData["email"] = user.email;
      userData["createdAt"] = user.createdAt;
      userData["isPrivate"] = user.isPrivate;

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

router.get("/dataByUser", async (req, res) => {
  try {
    const user = await User.findOne({username: req.headers.username});
    let userData = {};
    userData["id"] = user._id;
    userData["username"] = user.username;
    userData["email"] = user.email;
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

router.get("/getUser", async (req, res) => {
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

router.get("/follow", async (req, res) => {
  const { idUser, id } = req.query;
  try {
    const user = await User.findOne({following: {userId: id}});
    if(!user){
      const newFollowing = await User.findByIdAndUpdate(idUser, { $push: { following: { "userId": id } } });
      const newFollower = await User.findByIdAndUpdate(id, { $push: { followers: { "userId": idUser } } })
      res.json("Added followers");
    }else{
      res.send("Already following");
    }
    
  } catch {

  }
});

router.get("/unfollow", async (req, res) => {
  const { idUser, id } = req.query;
  try {
    const user = await User.findById(idUser);
    if(!(!user)){
      const newFollowing = await User.findByIdAndUpdate(idUser, { $pull: { following: { "userId": id } } });
      const newFollower = await User.findByIdAndUpdate(id, { $pull: { followers: { "userId": idUser } } })
      res.json("Removed followers");
    }else{
      res.send("Not following");
    }
    
  } catch {

  }
});

router.post("/getFollowerUsernames", async (req, res) => {
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

router.get("/deactivate", auth, async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.user.id);
      res.send("Succesfully deactivated")
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