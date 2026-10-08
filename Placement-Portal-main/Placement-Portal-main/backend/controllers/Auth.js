const User = require('../module/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const nodemon = require('nodemon');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');// To generate a unique OTP

require("dotenv").config();

exports.signUp = async (req,res)=>{
    try{ 
        const {name,email,password,role,branch,cgpa} = req.body;
        const existingUser =await User.findOne({email});
        if(existingUser){
            return res.status(400).json({
                success:false,
                message:'User already exists'
            });
        }
        let hashedPassword; 
        try{
            hashedPassword = await bcrypt.hash(password,10);
        }
        catch(err){
            return res.status(500).json({
                success:false,
                message:'could not hash the password ,please register again'
            })
        }
        const user = User.create({
            name,email,password:hashedPassword,role,branch,cgpa
        })
        res.status(200).json({
            success:true,
            message:'new user signed up successfully'
        })
    }
    catch(error){
        console.log('issue in signup ,please do it again');
        return res.status(200).json({
            success:false,
            message:"issue in signup ,please do it again"
        })
    }
}

exports.login = async (req,res)=>{
    try{

        const {email,password} = req.body;
        if(!email || !password){
            return res.status(400).json({
                success:false,
                message:"Please fill all details, And try again"
            })
        }
        let user = await User.findOne({email});

        if(!user){
            return res.status(400).json({
                success:false,
                message:"Not already Registered , please signin first"
            });
        }

        const payload = {
            email:user.email,
            id:user._id,
            role:user.role,
        }

        if(await bcrypt.compare(password,user.password)){

            const token = jwt.sign(payload,
                process.env.JWT_KEY,
                {
                    expiresIn:"2h",
                }
            );
            
            user = user.toObject()
            user.token = token;
            user.password = undefined;

            const options = {
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
                 secure: true, // Set to true if using HTTPS
                sameSite: 'None' // Required for cross-origin requests
            };
            res.cookie("token",token,options)
            return res.status(200).json({
                success:true,
                token,
                user,
                message:"User logged in successfully",
            })

        }else{
            return res.status(400).json({
                success:false,
                message:"Invalid Password"
            })
        }
    
    }catch(error){
        console.log(error)
        return res.status(500).json({ 
            success:false,
            message:"Login Failer"
        })
    }

}

exports.logout = async (req, res) => {
    try {
        res.clearCookie('token');

        return res.status(200).json({
            success: true,
            message: 'User logged out successfully'
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
};


exports.sendOtpForResetPswd = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if email is provided
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Please fill email and try again"
            });
        }

        // Check if the email exists in the database
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Email not found"
            });
        }

        // Generate a unique OTP
        const otp = uuidv4().split('-')[0]; // Taking only part of UUID for simplicity

        // Set expiration time to 3 minutes from now
        const expirationTime = new Date();
        expirationTime.setMinutes(expirationTime.getMinutes() + 3);

        // Store the OTP and its expiration time in the user document
        user.resetPasswordOtp = otp;
        user.resetPasswordOtpExpiration = expirationTime;
        await user.save();

        // Create a transporter object using SMTP transport
        let transporter = nodemailer.createTransport({
            service: 'gmail', // You can use any service like SendGrid, Mailgun, etc.
            auth: {
                user: process.env.EMAIL_USER, // Your email from environment variable
                pass: process.env.EMAIL_PASS  // Your email password from environment variable
            }
        });

        // Define email options
        let mailOptions = {
            from: process.env.EMAIL_USER, // sender address
            to: email, // list of receivers
            subject: 'Password Reset Request', // Subject line
            text: `You have requested a password reset on Portal website. Your OTP is: ${otp}`, // plain text body
            html: `<p>You have requested a password reset on Portal website.</p><p>Your OTP is: <b>${otp}</b></p>` // html body
        };

        // Send email with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).json({
                    success: false,
                    message: `Error sending email: ${error.message}`
                });
            } else {
                console.log('Email sent: ' + info.response);
                return res.status(200).json({
                    success: true,
                    message: 'Email sent successfully',
                    otp: otp // In a real application, you would store this OTP in your database for verification
                });
            }
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Check if email and OTP are provided
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Please provide email and OTP"
            });
        }

        // Check if the user exists in the database
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if OTP matches and has not expired
        if (user.resetPasswordOtp.toString() !== otp || new Date() > user.resetPasswordOtpExpiration) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Valid OTP"
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        // Check if email and new password are provided
        if (!email || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Please provide email and new password"
            });
        }

        // Find user by email
        const user = await User.findOne({ email });

        // Update user's password
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        try {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
            user.resetPasswordOtp = undefined;
            user.resetPasswordOtpExpiration = undefined;
            await user.save();
            return res.status(200).json({
                success: true,
                message: "Password changed successfully"
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Could not hash the password, please try again"
            });
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
