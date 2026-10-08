const jwt = require('jsonwebtoken');

require('dotenv').config();

exports.auth = (req,res,next)=>{
    try{
        const token = req.body.token || req.cookies.token || req.header("Authorization").replace("Bearer ","");
        if(!token){
            console.log("No token");
            return res.status(401).json({
                success:false,
                message:"Token Missing"
            })
        }
        try{
            const payload = jwt.verify(token,process.env.JWT_KEY);
            // console.log(payload)
        
            req.user = payload;
        }catch(error){
            return res.status(401).json({
                success:false,
                message:"Invalid Token"
            })
        }
        next();
    }catch(error){
        return res.status(401).json({
            success:true,
            message:"Something went wrong while verifiying the tokens",
            error
        })
    }
}

exports.isStudent = (req,res,next)=>{
    try{
        if(req.user.role !== 'Student'){
            return res.status(500).json({
                success:false,
                message:"This is protected route for students",
            });
        }
        next();
    }catch(error){
        return res.status(500).json({
            success:true,
            message:"The role is not matching",
        })
    }
}

exports.isAdmin = (req,res,next)=>{
    console.log(req.user.role);
    try{
        
        if(req.user.role !== 'Admin'){
            return res.status(500).json({
                success:false,
                message:"This is protected route for admins",
            });
        }
        next();
    }catch(error){
        return res.status(500).json({
            success:true,
            message:"The role is not matching",
        })
    }
}
