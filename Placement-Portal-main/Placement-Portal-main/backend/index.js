const express = require('express');
const cors = require('cors');
const app = express();
 
app.use(express.json());

app.use(cors({
    origin: 'https://placement-portal-frontend-eu7n.onrender.com',
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
    exposedHeaders: 'Content-Length, X-Kuma-Revision',
    maxAge: 600,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));
require('dotenv').config();
const cookieParser = require('cookie-parser');
app.use(cookieParser());
 


const PORT = process.env.PORT || 4000;

//To connect to database
const dbConnect = require('./config/database'); 
dbConnect();  


const user = require('./routes/user');
const placement = require('./routes/placement')
 
app.use('/user',user)
app.use('/job',placement) 

app.listen(PORT,()=>{
    console.log(`App is running on ${PORT}`);
})

  
