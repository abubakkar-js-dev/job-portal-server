const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const cors = require("cors");
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.y24v7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    // database for jobs

    const jobCollection = client.db("jobPortal").collection("jobs");
    const jobApplications = client
      .db("jobPortal")
      .collection("Job-Applications");



      // auth related api
      app.post('/jwt',async(req,res)=>{
        const user = req.body;
        const token = jwt.sign(user,'secret',{expiresIn: '1h'});
        res.send(token);
      })




      // job related api

    app.post("/job-applications", async (req, res) => {
      const application = req.body;
      const result = await jobApplications.insertOne(application);

      const id = application.job_id;
      const query = { _id: new ObjectId(id) };
      const job = res.send(result);
    });

    app.get("/jobs", async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { hr_email: email };
      }
      const cursor = jobCollection.find(query);
      const result = await cursor.toArray();

      res.send(result);
    });

    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await jobCollection.findOne(filter);

      res.send(result);
    });

    // post a new job

    app.post("/jobs", async (req, res) => {
      const newJobs = req.body;
      const result = await jobCollection.insertOne(newJobs);

      res.send(result);
    });

    app.get("/job-applications", async (req, res) => {
      const cursor = jobApplications.find();
      const result = await cursor.toArray();

      res.send(result);
    });

    // get job applicaiton by id

    app.get("/my-application/", async (req, res) => {
      const email = req.query.email;
      const filter = { applicant_email: email };
      const cursor = jobApplications.find(filter);
      const result = await cursor.toArray();

      for (const applicaiton of result) {
        const query = { _id: new ObjectId(applicaiton.job_id) };
        const job = await jobCollection.findOne(query);

        if (job) {
          applicaiton.title = job.title;
          applicaiton.location = job.location;
          applicaiton.copmany = job.copmany;
          applicaiton.company_logo = job.company_logo;
        }
      }

      res.send(result);
    });

    // app.get('/job-applications/:id') ==> get a specific job application by id
    app.get('/job-applications/jobs/:job_id',async(req,res)=>{
      const jobId = req.params.job_id;
      const filter = {job_id: jobId};
      const result = await jobApplications.find(filter).toArray();

      res.send(result);
    })


    app.patch('/job-applications/:id',async(req,res)=>{
      const id = req.params.id;
      const data = req.body;
      const filter = {_id: new ObjectId(id)};
      const option = {upsert: true};

      const updatedDoc = {
        $set: {
          status: data.status
        }
      }

      const result = await jobApplications.updateOne(filter,updatedDoc,option);
      res.send(result);
    })



    
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Job portal server is running");
});

app.listen(port, () => {
  console.log(`Job is waiting at: ${port}`);
});
