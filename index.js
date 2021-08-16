const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
require('dotenv').config()
const admin = require('firebase-admin');
const ObjectId =require('mongodb').ObjectID;



const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.stsuc.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const app = express()
const port = 5000

app.use(bodyParser.json());
app.use(cors());

var serviceAccount = require("./configs/parrot-express-firebase-adminsdk-gmyuo-eacace7aff.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:`process.env.FIRE_DB`
});

//Nodemailer
var nodemailer = require('nodemailer');
const sendEmail=bookingData=>{
  console.log(bookingData.email);
  

  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'rakib141746@gmail.com',
      pass: 'devRakib420'
    }
  });

  var mailOptions = {
    from: 'rakib141746@gmail.com',
    to: `${bookingData.email}`,
    // to: 'rakib141746@gmail.com',
    subject: 'New Booking on ParrotEx (No Reply)',
    html: `
    <p>Hello! ${bookingData.name},</p>
    <p>You have placed a booking to ParrotEx on ${bookingData.date}. Your booking id is #${bookingData._id}.</p>
    <p>Your product weight is ${bookingData.weight} kg and your total cost is ${bookingData.totalCost} Taka. </p>
    <p>Thank you for staying with ParrotEx.</p>
    `
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const serviceCollection = client.db(`${process.env.DB_NAME}`).collection("services");
  const bookingsCollection = client.db(`${process.env.DB_NAME}`).collection("bookings");
  const adminsCollection = client.db(`${process.env.DB_NAME}`).collection("admins");
  const managersCollection = client.db(`${process.env.DB_NAME}`).collection("managers");
  const reviewsCollection = client.db(`${process.env.DB_NAME}`).collection("reviews");

  //add service
  app.post('/addService', (req,res)=>{
    const newService= req.body;
    serviceCollection.insertOne(newService)
    .then(result=>{
      
      res.send(result.insertedCount > 0)
    })
  })

  //load all service
  app.get('/services', (req,res)=>{
    serviceCollection.find()
    .toArray((err, items)=>{
      res.send(items)
    })  
  })

  //load service by id
  app.get('/service/:id', (req,res)=>{
    serviceCollection.find({_id: ObjectId(req.params.id)})
    .toArray( (err, documents)=>{
      res.send(documents[0]);
    })
  })
  
  //load service by name
  app.get('/service/name/:name', (req,res)=>{
    serviceCollection.find({serviceName: req.params.name})
    .toArray( (err, documents)=>{
      res.send(documents[0]);
    })
  })

  app.delete('/delete/:id', (req,res)=>{ 
    serviceCollection.deleteOne({_id: ObjectId(req.params.id)})
    .then( result=>{
      res.send(result.deletedCount > 0)
    })
  })

  //update service
  app.patch('/update/:id',(req,res)=>{
    serviceCollection.updateOne({_id: ObjectId(req.params.id)},
    {
      $set: {serviceName: req.body.serviceName,description: req.body.description,price: req.body.price,imageURL: req.body.imageURL}
    })
    .then( result=>{
      res.send(result.modifiedCount > 0)
    })
  })

  // book service
  app.post('/addBooking', (req, res) => {
    const bookingData = req.body;
    const newBooking= req.body;
    bookingsCollection.insertOne(newBooking)
    .then(result=>{
      sendEmail(bookingData);
      res.send(result.insertedCount > 0);
    })
  })


  app.get('/bookings', (req, res) => {
    const bearer=req.headers.authorization;
     if(bearer && bearer.startsWith('Bearer ')){
      const idToken =bearer.split(' ')[1];
      admin.auth().verifyIdToken(idToken)
       .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if(tokenEmail == queryEmail){
              bookingsCollection.find({email: queryEmail})
                .toArray((err, documents)=>{
                  res.status(200).send(documents)
                })
          }
          else{
            res.status(401).send('Un-authorized Access')
          }
       })
       .catch((error) => {
          res.status(401).send('Un-authorized Access')
       });
   }
   else{
      res.status(401).send('Un-authorized Access')
   }
  })


//load all bookings
app.get('/bookings/all', (req,res)=>{
    bookingsCollection.find()
    .toArray((err, items)=>{
      res.send(items)
    })  
  })

  //Load bookings by id
  app.get('/booking/:id', (req,res)=>{
    bookingsCollection.find({_id: ObjectId(req.params.id)})
    .toArray((err, items)=>{
      res.send(items)
    })  
  })

  //edit booking status
  app.patch('/booking/update/:id',(req,res)=>{
    bookingsCollection.updateOne({_id: ObjectId(req.params.id)},
    {
      $set: {status: req.body.status}
    })
    .then( result=>{
      res.send(result.modifiedCount > 0)
    })
  })

  //delete booking
  app.delete('/booking/delete/:id', (req,res)=>{ 
    bookingsCollection.deleteOne({_id: ObjectId(req.params.id)})
    .then( result=>{
      res.send(result.deletedCount > 0)
    })
  })

  //add admin
  app.post('/addAdmin', (req, res) => {
    const newAdmin= req.body;
    adminsCollection.insertOne(newAdmin)
    .then(result=>{
      res.send(result.insertedCount > 0);
    })
  })

  app.post('/isAdmin', (req, res) => {
    const email = req.body.email;
    adminsCollection.find({ email: email })
        .toArray((err, admins) => {
            res.send(admins.length > 0);
        })
  })

  //add manager
  app.post('/addManager', (req, res) => {
    const newManager= req.body;
    managersCollection.insertOne(newManager)
    .then(result=>{
      res.send(result.insertedCount > 0);
    })
  })

  app.post('/isManager', (req, res) => {
    const email = req.body.email;
    managersCollection.find({ email: email })
        .toArray((err, managers) => {
            res.send(managers.length > 0);
        })
  })

  app.get('/managers', (req, res) => {
    const bearer=req.headers.authorization;
     if(bearer && bearer.startsWith('Bearer ')){
      const idToken =bearer.split(' ')[1];
      admin.auth().verifyIdToken(idToken)
       .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if(tokenEmail == queryEmail){
            managersCollection.find({email: queryEmail})
                .toArray((err, documents)=>{
                  res.status(200).send(documents)
                })
          }
          else{
            res.status(401).send('Un-authorized Access')
          }
       })
       .catch((error) => {
          res.status(401).send('Un-authorized Access')
       });
   }
   else{
      res.status(401).send('Un-authorized Access')
   }
  })

  //load all manager
app.get('/managers/all', (req,res)=>{
  managersCollection.find()
  .toArray((err, items)=>{
    res.send(items)
  })  
})

  //Add reviews
  app.post('/addReview', (req, res) => {
    const newReview= req.body;
    reviewsCollection.insertOne(newReview)
    .then(result=>{
      res.send(result.insertedCount > 0);
    })
  })

  //load reviews
  app.get('/reviews', (req,res)=>{
    reviewsCollection.find()
    .toArray((err, items)=>{
      res.send(items)
    })  
  })
});

app.get('/', (req, res) => {
  
    res.send('Welcome to Parrot Express Server.')
  })
  
  app.listen(process.env.PORT || port)