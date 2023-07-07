const express = require('express');

const app = express();
const cors = require('cors');
const bcryptjs = require('bcryptjs');
app.use(express.json());

app.use((req, res, next) => {
   
  res.setHeader('Access-Control-Allow-Origin', 'https://fancy-sprinkles-7cb600.netlify.app','http://localhost:3001');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// app.use(
//     cors({
//       origin: "https://fancy-sprinkles-7cb600.netlify.app/",
//     })
//   );
const mongodb = require('mongodb');
const mongoClient = mongodb.MongoClient;
const dotenv = require('dotenv').config();
const URL = process.env.DB;
const usermail = process.env.USER;
const mailpassword = process.env.PASSWORD
const jwt = require('jsonwebtoken');

const rn = require('random-number');
const options = {
    min: 1000,
    max: 9999,
    integer: true
}
const nodemailer = require("nodemailer");






app.get("/", function (req, res) {
    response.send("welcome to password reset flow api🎉🎉🎉🎉🎉");
});


//1 register
app.post('/register', async (req, res) => {
    console.log(req.body)
    try {
      const connection = await mongoClient.connect(URL);
      const db = connection.db('password');
      const user = await db.collection('users').findOne({ username: req.body.email });
      if (user) {
        res.json({ message: 'User already exists' });
      } else {
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(req.body.password, salt);
        const newUser = {
          email: req.body.email,
          password: hashedPassword
        };
        await db.collection('users').insertOne(newUser);
        res.json({ message: 'User created and registered successfully' });
      }
      connection.close();
    } catch (error) {
      console.log(error);
      res.json({ message: 'Error creating user' });
    }
  });



  //2.login
  app.post('/login', async (req, res) => {
    try {
      console.log('req.body:', req.body); // check the request body
      const connection = await mongoClient.connect(URL);
      const db = connection.db('password');
      const user = await db.collection('users').findOne({ email: req.body.email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      console.log('user:', user); // check if the user object is retrieved correctly
      const isPasswordMatch = await bcryptjs.compare(req.body.password, user.password);
      if (!isPasswordMatch) {
        return res.status(401).json({ message: 'Incorrect password' });
      }
      const token = jwt.sign({ _id: user._id, email: user.email }, process.env.SECRET_KEY, { expiresIn: '1h' });
      res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });


//Verification email
  app.post('/sendmail', async function (req, res) {
    console.log(req.body)
    try {
        const connection = await mongoClient.connect(URL);
        const db = connection.db('password');
        const user = await db.collection('users').findOne({ email: req.body.email });
        if (user) {
            let randomnum = rn(options);

            await db.collection('users').updateOne({ email: req.body.email }, { $set: { rnum: randomnum } });
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                host: "smtp.gmail.com",
                secure: false,
                auth: {
                    user: `${usermail}`,
                    pass: `${mailpassword}`,
                }
            });

            var mailOptions = {
                from:'bbnbadhri@gmail.com',
                to: `${req.body.email}`,
                subject: 'User verification',
                text: `${randomnum}`,
               
            };

            console.log(mailOptions); // add this line to log mailOptions object to console

            await transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                    res.json({
                        message: "Error"
                    })
                } else {
                    console.log('Email sent: ' + info.response);
                    res.json({
                        message: "Email sent"
                    })
                }
            });
        }
        else {
            res.status(400).json({ message: 'User not found' })
        }
    }
    catch (error) {
        console.log(error);
    }
});



// to verify the customer

app.post("/verify", async (req, res) => {
  console.log(req.body)
  try {
      const connection = await mongoClient.connect(URL);
      const db = connection.db('password');
      const user = await db.collection('users').findOne({ email: req.body.email });
      await connection.close();
      if (user.rnum === req.body.vercode) {
          res.status(200).json(user)
      }
      else {
          res.status(400).json({ message: "Invalid Verification Code" })
      }
  } catch (error) {
      console.log(error);
  }
})




// update password

app.post('/changepassword/:id', async function (req, res) {
  console.log(req.params.id)
  try {

      const connection = await mongoClient.connect(URL);
      const db = connection.db('password');
      const salt = await bcryptjs.genSalt(10);
      const hash = await bcryptjs.hash(req.body.password1, salt);
      req.body.password1 = hash;
      delete req.body.password2;
      await db.collection('users').updateOne({ email: req.params.id }, { $set: {password:req.body.password1} });;
      await connection.close();
      res.json({ message: "Password updated successfully" })
  } catch (error) {
      console.log(error);
  }
})

  






app.listen(process.env.PORT, () => console.log("Mongo Db Server Started Succesfully", process.env.PORT));