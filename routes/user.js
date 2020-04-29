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
            password
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
                password
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

    const { email, username, password, id } = req.body;
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

      if (email){
        User.findByIdAndUpdate(id, {email: email, updatedAt: Date()}, function(err, ress){
          if(err) {
            return res.status(400).json({
              type: "email",
              message: err
            });
          }else{
            console.log(ress)
          }
        })
      }
      if (username){
        User.findByIdAndUpdate(id, {username: username, updatedAt: Date()}, function(err, ress){
          if(err) {
            return res.status(400).json({
              type: "username",
              message: err
            });
          }else{
            console.log(ress)
          }
        })
      }
      if (password){
        const salt = await bcrypt.genSalt(10);
        const hashpassword = await bcrypt.hash(password, salt);
        User.findByIdAndUpdate(id, {password: hashpassword, updatedAt: Date()}, function(err, ress){
          if(err) {
            return res.status(400).json({
              type: "email",
              message: err
            });
          }else{
            console.log(ress)
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
      userData["following"] = user.following;
      userData["followers"] = user.followers;
      userData["createdAt"] = user.createdAt;
      res.json(userData);
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

router.get("/follow", auth, async (req, res) => {
  const { id } = req.query;
  try {
    const user = await User.findOne({following: {userId: id}});
    console.log(user)
    if(!user){
      const newFollowing = await User.findByIdAndUpdate(req.user.id, { $push: { following: { "userId": id } } });
      const newFollower = await User.findByIdAndUpdate(id, { $push: { followers: { "userId": req.user.id } } })
      res.json("Added followers");
    }else{
      res.send("Already following");
    }
    
  } catch {

  }
});

router.get("/unfollow", auth, async (req, res) => {
  const { id } = req.query;
  try {
    const user = await User.findById(req.user.id);
    if(!(!user)){
      const newFollowing = await User.findByIdAndUpdate(req.user.id, { $pull: { following: { "userId": id } } });
      const newFollower = await User.findByIdAndUpdate(id, { $pull: { followers: { "userId": req.user.id } } })
      res.json("Removed followers");
    }else{
      res.send("Not following");
    }
    
  } catch {

  }
});

router.get("/deactivate", auth, async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.user.id);
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