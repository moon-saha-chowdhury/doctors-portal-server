const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs-extra');
const fileUpload = require('express-fileupload')
require('dotenv').config()
console.log(process.env.DB_USER);
const port = process.env.PORT || 5000



const app = express()
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('doctors')); //That's mean a folder will be created to store file named doctors 
app.use(fileUpload());

app.get('/', (req, res) => {
  res.send('Hello World! Welcome to doctors portal')
})


//Connect To Database
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sr6rc.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  console.log("connectio error", err);
  const appointmentCollection = client.db("doctorsPortal").collection("appointments");
  const doctorCollection = client.db("doctorsPortal").collection("doctors");
  console.log("database connected successfully");

  //Inserting appointment data into database
  app.post('/addAppointment', (req, res) => {
    const appointment = req.body;
    console.log(appointment);
    appointmentCollection.insertOne(appointment)
      .then(result => {
        res.send(result.insertedCount > 0)

      })

  })

  //finding date for appointments
  app.post('/appointmentsByDate', (req, res) => {
    const date = req.body;
    const email = req.body.email;
    doctorCollection.find({ email: email })
      .toArray((err, doctors) => {
        const filter = { date: date.date }
        if (doctors.length === 0) {
          filter.email = email
        }
        console.log(date.date);
        appointmentCollection.find(filter)
          .toArray((err, documents) => {
            console.log(email, date.date, doctors, documents)
            res.send(documents);
          })
      })


  })

  //getting data from database
  app.get('/appointments', (req, res) => {
    appointmentCollection.find({})
      .toArray((err, documents) => {
        res.send(documents);
      })
  })


  //getting doctors data from database
  app.get('/allDoctors', (req, res) => {
    doctorCollection.find({})
      .toArray((err, documents) => {
        res.send(documents);
      })
  })




  //adding doctors

  app.post('/addADoctor', (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const email = req.body.email;
    // const photoName = file.name;
    const filePath = `${__dirname}/doctors/${file.name}`;

    console.log(name, email, file);
    file.mv(filePath, err => {
      if (err) {
        console.log(err);
        return res.status(500).send({ msg: "failed to upload file" });
      }
      const newImg = fs.readFileSync(filePath);
      const encodedImg = newImg.toString('base64');

      const image = {
        contentType: req.files.file.mimetype,
        size: req.files.file.size,
        img: Buffer(encodedImg, 'base64')

      };

      doctorCollection.insertOne({ name, email, image })
        .then(result => {
          fs.remove(filePath, error =>{
            if(error){
              console.log(error);
              return res.status(500).send({ msg: "failed to upload file" });
            }
            res.send(result.insertedCount > 0)

          })
        })
      // return res.send({name: file.name, path: `${file.name}`})
    })

    //   const newImg = req.files.file.data;
    //   const encodeImg = newImg.toString('base64');
    //   const image = {
    //     contentType: req.files.file.mimetype,
    //     size: req.files.file.size,
    //     img: Buffer.from(encodeImg, 'base64')
    // };

    // doctorCollection.insertOne({ name, email, image,photoName })
    //             .then(result => {
    //                 console.log(result)
    //             })



  })



  //Checking the user is doctor or not
  app.post('/isDoctor', (req, res) => {
    const email = req.body.email;
    doctorCollection.find({ email: email })
      .toArray((err, doctors) => {
        res.send(doctors.length > 0)

      })


  })


});



app.listen(port);