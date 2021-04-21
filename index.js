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

var serviceAccount = require("./configs/handyy-man-firebase-adminsdk-sy9uu-af4a45bfed.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:`process.env.FIRE_DB`
});

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const serviceCollection = client.db(`${process.env.DB_NAME}`).collection("services");
  const bookingsCollection = client.db(`${process.env.DB_NAME}`).collection("bookings");
  const adminsCollection = client.db(`${process.env.DB_NAME}`).collection("admins");
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
  app.post('/booking', (req, res) => {
    const newBooking= req.body;
    bookingsCollection.insertOne(newBooking)
    .then(result=>{
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
    const newBooking= req.body;
    adminsCollection.insertOne(newBooking)
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

  app.post('/addReview', (req, res) => {
    const newReview= req.body;
    reviewsCollection.insertOne(newReview)
    .then(result=>{
      res.send(result.insertedCount > 0);
    })
  })

  //load all bookings
  app.get('/reviews', (req,res)=>{
    reviewsCollection.find()
    .toArray((err, items)=>{
      res.send(items)
    })  
  })
});

app.get('/', (req, res) => {
  
    res.send('Hello World!')
  })
  
  app.listen(process.env.PORT || port)