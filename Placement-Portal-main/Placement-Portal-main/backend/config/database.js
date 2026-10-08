const mongoose =require('mongoose');

require('dotenv').config();

const dbConnect = () =>{
    mongoose.connect(process.env.DATABASE_URL,{
        useNewUrlParser:true,
        useUnifiedTopology:true,
    })
    .then(()=>{console.log('Connected to db successfully')})
    .catch((err)=>{
        console.log('Issues in connectig with db');
        console.error(err); 
    }) 
} 

module.exports = dbConnect; 
