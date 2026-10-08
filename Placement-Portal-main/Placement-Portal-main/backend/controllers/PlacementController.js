const PlacementCard = require('../module/PlacementCard');
const User = require("../module/User")
const moment = require('moment-timezone');
const jwt = require('jsonwebtoken')

exports.createJob = async (req,res)=>{
    try{
        const {title,Company,Salary,branch,expiretime,cgpa} = req.body;
        console.log(title)
        const existingJob =await PlacementCard.findOne({title});
        if(existingJob){
            return res.status(400).json({
                success:false,
                message:'Job Already exists or change job name'
            });
        }
        const job = await PlacementCard.create({
            title,Company,Salary,branch,expiretime,cgpa
        }) 

        res.status(200).json({
            success:true,
            message:'new job created successfully',
            job:job
        })
    }
    catch(error){
        console.log('issue in creating job ,please do it again');
        return res.status(200).json({
            success:false,
            message:"issue in creating job ,please do it again"
        })
    }
}

exports.getJobs = async (req, res) => {
    try {
        const payload = req.user;
        const loggedInUserID = payload.id;

        // Find the logged-in user
        const loggedInUser = await User.findOne({ _id: loggedInUserID });
        if (!loggedInUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        

        // Find all jobs matching the user's branch and not expired
        const userCGPA = loggedInUser.cgpa;
        const userBranch = loggedInUser.branch;
        const currentDate = moment().toISOString();
        const formattedDate = moment(currentDate).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');

        const selectedJobIds = loggedInUser.placementCards
            .filter(card => card.selected && card.resultsPosted)
            .map(card => card.placementCard.toString());

        const notSelectedJobIds = loggedInUser.placementCards
            .filter(card => card.resultsPosted && !card.selected)
            .map(card => card.placementCard.toString());
            
        const appliedJobIds = loggedInUser.placementCards
            .filter(card => !card.resultsPosted && !card.selected) // Filter out selected but not posted jobs
            .map(card => card.placementCard.toString());

        // Fetch available jobs from PlacementCard schema
        const availableJobs = await PlacementCard.find({ 
            branch: userBranch, 
            expiretime: { $gt: formattedDate }, 
            $expr: { 
                $lte: [
                    { $toDouble: "$cgpa" }, // Convert cgpa field to float
                    parseFloat(userCGPA) // Convert userCGPA to float
                ]
            }
        });
        console.log(availableJobs)

        // Filter out applied, selected, and not selected jobs
        const availableJobsIds = availableJobs.filter(job => 
            !appliedJobIds.includes(job._id.toString()) &&  
            !selectedJobIds.includes(job._id.toString()) &&
            !notSelectedJobIds.includes(job._id.toString())
        );

        // Populate job details for all available, applied, and selected jobs
        const allAppliedJobs = await Promise.all(appliedJobIds.map(id => PlacementCard.findById(id)));
        const allSelectedJobs = await Promise.all(selectedJobIds.map(id => PlacementCard.findById(id)));
        const allNotSelectedJobs = await Promise.all(notSelectedJobIds.map(id => PlacementCard.findById(id)));
        const allAvailableJobs = await Promise.all(availableJobsIds.map(job => PlacementCard.findById(job)));


        return res.status(200).json({
            success: true,
            message: 'Found jobs successfully',
            allAppliedJobs: allAppliedJobs,
            allSelectedJobs: allSelectedJobs,
            allNotSelectedJobs: allNotSelectedJobs,
            allAvailableJobs: allAvailableJobs
        });
    } catch (error) {
        console.error("Error in finding jobs:", error);
        return res.status(500).json({
            success: false,
            message: 'Error in finding jobs'
        });
    }
};





exports.applyJob = async (req, res) => {
    try {
        const { jobID } = req.body;
        const payload = req.user;
        const loggedInUserID = payload.id;

        // Find the logged-in user
        let loggedInUser = await User.findOne({ _id: loggedInUserID });
        if (!loggedInUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Find the job 
        let job = await PlacementCard.findOne({ _id: jobID });
        if (!job) {
            return res.status(404).json({
                success: false, 
                message: "Job not found" 
            });
        }

        console.log("Job:", job); // Add this line to see the job data
        
        // Check if the user has already applied to this job
        let userAlreadyApplied = false;
        job.User.forEach(user => {
            const userID = user.user.toString();
            console.log("User ID:", userID);
            if (userID === loggedInUserID.toString()) {
                userAlreadyApplied = true;
            }
        });

        if (userAlreadyApplied) {
            return res.status(400).json({
                success: false,
                message: "You have already applied to this job" 
            });
        }

        // If user hasn't applied, add the user's ID to the job's User array
        job.User.push({ selected: false, user: loggedInUserID });
        await job.save();

        // Also, add the job's ID to the user's placementCards array
        loggedInUser.placementCards.push({ selected: false, placementCard: jobID });
        await loggedInUser.save();

        return res.status(200).json({
            success: true,
            message: "Applied to job successfully"
        });

    } catch(error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error in applying for Job"
        });
    }
};

exports.getAllJobsByAdmin = async (req, res) => {
    try {
        const jobs = await PlacementCard.find({});
        return res.status(200).json({
            success: true,
            jobs: jobs
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error retrieving jobs"
        });
    }
}


exports.getStudentsAppliedForJob = async (req, res) => {
    try {
        const { jobid } = req.body;

        // Find the job by its ID
        const job = await PlacementCard.findOne({ _id: jobid });
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        // Extract the list of user IDs associated with the job
        const userIds = job.User.map(user => user.user);

        // Find users by their IDs
        const users = await User.find({ _id: { $in: userIds } });

        // Extract names, emails, and IDs of the users
        const selectedUsers = users.map(user => ({
            name: user.name,
            email: user.email,
            userId: user._id,
            selected:user.selected,
            branch:user.branch
        }));

        return res.status(200).json({ 
            success: true,
            selectedUsers: selectedUsers,
            nameOfJob:job.title,
            company:job.Company
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({
            success: false,
            message: "Error retrieving selected users for the job"
        });
    }
}

exports.uploadResultsOfJob = async (req, res) => {
    try {
        console.log("In upload Results")
        const { jobid, selectedUserIds } = req.body;
        console.log(selectedUserIds)
        const placementCard = await PlacementCard.findById(jobid);
        if (!placementCard) {
            return res.status(404).json({
                success: false,
                message: "Placement card not found"
            });
        }
        // Set resultsPosted to true for the specified PlacementCard
        console.log(placementCard)
        placementCard.resultsPosted = true;
        await placementCard.save();
        console.log(placementCard)
        const flag=true;
        // Extract all user IDs from the PlacementCard document
        const allUserIds = placementCard.User.map(userEntry => userEntry.user.toString());
        // Get the non-selected user IDs
            const nonSelectedUserIds = allUserIds.filter(userId => !selectedUserIds.includes(userId));
            if(selectedUserIds.length!=0){
            // Update resultsPosted status for the specified job in PlacementCard model
            const updatePlacementResult = await PlacementCard.updateOne(
                { _id: jobid },
                { $set: { resultsPosted: true  } }
            );
            for (const userId of selectedUserIds) {
                await PlacementCard.updateOne(
                    { _id: jobid, 'User.user': userId },
                    { $set: { 'User.$.selected': true } }
                );
            }
            

            // Update resultsPosted status for selected jobs in User model
            const updateUserResult = await User.updateMany(
                { _id: { $in: selectedUserIds }, 'placementCards.placementCard': jobid },
                { $set: { 'placementCards.$.resultsPosted': true,'placementCards.$.selected':true } }
            );
            if(!updatePlacementResult||!updateUserResult){
                flag=false;
                return res.status(500).json({
                    success: false,
                    message: "Error uploading results"
                });
            }
        }
        if(nonSelectedUserIds.length!=0){
            const updateUserResultForNonSelectedUsers = await User.updateMany(
                { _id: { $in: nonSelectedUserIds }, 'placementCards.placementCard': jobid },
                { $set: { 'placementCards.$.resultsPosted': true,'placementCards.$.selected':false } }
            );
            if(!updateUserResultForNonSelectedUsers){
                flag=false;
                return res.status(500).json({
                    success: false,
                    message: "Error uploading results"
                });
            }
        }

        if (flag) {
            return res.status(200).json({
                success: true,
                message: "Results uploaded successfully"
            });
        } else {
            return res.status(500).json({
                success: false,
                message: "Error uploading results"
            });
        }
    } catch (error) {
        console.error("Error uploading results:", error);
        return res.status(500).json({
            success: false,
            message: "Error uploading results"
        });
    }
};

exports.getStudentsSelectedForJob = async(req,res) => {
    try{
        const {jobid}=req.body;
        const job = await PlacementCard.findOne({ _id: jobid });
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }
        // Extract the list of user IDs associated with the job
        const selectedUsers = job.User.filter(user => user.selected);
        // Get  their IDs
        const userIds = selectedUsers.map(user => user.user);
        //Get details
        const users = await User.find({ _id: { $in: userIds } });
        // Extract names, emails, and IDs of the users
        const selectedUsersForJob = users.map(user => ({
                name: user.name,
                email: user.email,
                userId: user._id,
                selected:user.selected,
                branch:user.branch
            }));

        return res.status(200).json({ 
            success: true,
            selectedUsers: selectedUsersForJob,
            nameOfJob:job.title,
            company:job.Company
        });
        } 
        catch (error) {
        console.error("Error:", error);
        return res.status(500).json({
            success: false,
            message: "Error retrieving selected users for the job"
        });
        }
}

exports.uploadGpa = async (req, res) => {
    try {
        const { id, name, branch, gpa } = req.body;
        // console.log(id,name,branch,gpa)
        // Find the student by ID and update their GPA
        const updatedStudent = await User.findOneAndUpdate(
            { _id: id }, // Find student by ID
            { $set: { cgpa: gpa } }, // Update GPA
            { new: true } // Return the updated document
        );
        // console.log(updatedStudent)

        if (!updatedStudent) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "GPA updated successfully",
            student: updatedStudent // Return the updated student
        });
    } catch (error) {
        console.error('Error updating GPA:', error);
        return res.status(500).json({
            success: false,
            message: "Error updating GPA"
        });
    }
};