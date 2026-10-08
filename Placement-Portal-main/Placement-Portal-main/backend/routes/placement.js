const express = require('express');

router = express.Router();

const {createJob , getJobs , applyJob ,getAllJobsByAdmin, getStudentsAppliedForJob, uploadResultsOfJob,getStudentsSelectedForJob,uploadGpa} = require('../controllers/PlacementController');
const {auth, isStudent, isAdmin} = require('../Middleware/auth')

router.post('/createJob',auth,isAdmin,createJob)
router.get('/getJobs',auth,isStudent,getJobs) 
router.post('/applyJob',auth,isStudent,applyJob)
router.get('/getAllJobsByAdmin',auth,isAdmin,getAllJobsByAdmin);
router.post('/getStudentsAppliedForJob',auth,isAdmin,getStudentsAppliedForJob);
router.post('/uploadResultsOfJob',auth,isAdmin,uploadResultsOfJob);
router.post('/getStudentsSelectedForJob',auth,isAdmin,getStudentsSelectedForJob)
router.post('/uploadGpa',auth,isAdmin,uploadGpa);

module.exports = router;  
