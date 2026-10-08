import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import NavbarAfterLogin from './NavbarAfterLogin';
import axios from 'axios';
import { useUser } from "../user-context";

export default function PostResults() {
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
    const { setJob } = useUser();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);

    useEffect(() => {
        fetchAllJobs();
    }, []);

    const fetchAllJobs = async () => {
        try {
            const getAllJobsByAdminEndpoint = `${apiBaseUrl}/job/getAllJobsByAdmin`;
            const response = await axios.get(getAllJobsByAdminEndpoint, { withCredentials: true });
            if (response.data.success) {
                setJobs(response.data.jobs);
            } else {
                console.error('Failed to fetch jobs:', response.data.message);
            }
        } catch (error) {
            console.error('Error fetching jobs:', error);
        }
    };

    const handleViewUsers = (jobId, resultsPosted) => {
        setJob(jobId);
        if (resultsPosted) {
            navigate("/seeResults");
        } else {
            navigate("/postResultsHere");
        }
    };

    const handleUploadResults = async (jobId, selectedUserIds) => {
        try {
            if (selectedUserIds.length === 0) {
                const confirmSubmit = window.confirm("No users are selected. Do you want to submit the results anyway?");
                if (!confirmSubmit) {
                    return; // Abort submission
                }
            }
            const uploadResultsEndpoint = `${apiBaseUrl}/job/uploadResultsOfJob`;
            const response = await axios.post(uploadResultsEndpoint, { jobid: jobId, selectedUserIds }, { withCredentials: true });
            if (response.data.success) {
                console.log("Results uploaded successfully");
                fetchAllJobs(); // Refresh the job list after successful upload
            } else {
                console.error('Failed to upload results:', response.data.message);
            }
        } catch (error) {
            console.error('Error uploading results:', error);
        }
    };

    return (
        <div>
            <Toaster />
            <NavbarAfterLogin />
            <div style={{ position: 'absolute', top: '15%', left: '5%' }}>
                <button onClick={() => navigate('/adminHome')} style={{ backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Back</button>
            </div>

            <div style={{ marginTop: '8%', marginLeft: '5%' }}>
                <h2>All Jobs</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {jobs.map(job => (
                        <div key={job._id} style={{ backgroundColor: '#f9f9f9', borderRadius: '2%', boxShadow: '0 1%', padding: '2%', marginBottom: '2%', marginRight: '2%' }}>
                            <h3>{job.title}</h3>
                            <p>Company: {job.Company}</p>
                            <p>No of Students Applied: {job.User.length}</p>
                            <button onClick={() => handleViewUsers(job._id, job.resultsPosted)}>
                                {job.resultsPosted ? "View Results" : "View Users"}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
