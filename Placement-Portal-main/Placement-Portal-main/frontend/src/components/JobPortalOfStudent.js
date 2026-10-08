import React, { useEffect, useState } from 'react';
import { useUser } from "../user-context";
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';


export default function JobPortalOfStudent() {
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
    const { user } = useUser();
    const [jobs, setJobs] = useState({ availableJobs: [], appliedJobs: [], selectedJobs: [], notSelectedJobs: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch jobs from the backend when the component mounts
        fetchJobsFromBackend();
    }, []);

    // Function to format the deadline
    const formatDeadline = (deadline) => {
        // Extract date and time components using regex
        const dateRegex = /^(\d{4})-(\d{2})-(\d{2})T/;
        const timeRegex = /T(\d{2}):(\d{2}):(\d{2})/;
        const [year, month, day] = deadline.match(dateRegex).slice(1);
        const [hours, minutes] = deadline.match(timeRegex).slice(1);

        // Format day with suffix
        let dayWithSuffix;
        switch (parseInt(day)) {
            case 1:
            case 21:
            case 31:
                dayWithSuffix = day + "st";
                break;
            case 2:
            case 22:
                dayWithSuffix = day + "nd";
                break;
            case 3:
            case 23:
                dayWithSuffix = day + "rd";
                break;
            default:
                dayWithSuffix = day + "th";
        }

        // Convert month to long form
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const monthName = months[parseInt(month) - 1];

        // Convert hours to 12-hour format and add AM or PM
        const amPm = parseInt(hours) >= 12 ? 'pm' : 'am';
        const formattedHours = parseInt(hours) % 12 === 0 ? 12 : parseInt(hours) % 12;
        const formattedMinutes = parseInt(minutes) < 10 ? '0' + minutes : minutes;

        // Construct the formatted deadline string
        const formattedDeadline = `${dayWithSuffix} ${monthName} ${year} ${formattedHours}:${formattedMinutes} ${amPm}`;
        return formattedDeadline;
    }

    // Function to fetch jobs from the backend
    const fetchJobsFromBackend = async () => {
        // Check if a user is logged in
        if (user) {
            setLoading(true); // Set loading state to true
            
            try {
                const getJobsEndpoint = `${apiBaseUrl}/job/getJobs`;
                // Fetch jobs from the backend
                const result = await axios.get(getJobsEndpoint, { withCredentials: true });
                // Process the result
                if (result.data.success) {
                    const { allAvailableJobs, allAppliedJobs, allSelectedJobs, allNotSelectedJobs } = result.data;
                    console.log(result.data)
                    setJobs({ availableJobs: allAvailableJobs, appliedJobs: allAppliedJobs, selectedJobs: allSelectedJobs, notSelectedJobs: allNotSelectedJobs });
                } else {
                    console.log(result.data.message); // Log the error message
                }
            } catch (error) {
                console.error('Error:', error.message); // Log any errors
            } finally {
                setLoading(false); // Set loading state to false after fetching jobs
            }
        } else {
            setLoading(false); // Set loading state to false
        }
    };

    // Callback function when "Apply" button is clicked
    const handleApply = async (jobId) => {
        console.log(`Applying to job with ID: ${jobId}`);
        const applyJobEndpoint = `${apiBaseUrl}/job/applyJob`;
        await axios.post(applyJobEndpoint, { jobID: jobId }, { withCredentials: true })
            .then((result) => {
                console.log(result)
                if (result.data.success) {
                    toast.success("Applied successfully");
                    // Fetch updated jobs after successful application
                    fetchJobsFromBackend();                     
                } else {
                    toast.error(result.data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error.message);
            });
    }

    return (
        <div>
            <Toaster />
            {user && (
                <div>
                    {loading && <p>Loading...</p>}
                    
                    {/* Render selected jobs */}
                    {jobs.selectedJobs&& jobs.selectedJobs.length > 0 && (
                        <div>
                            <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>Selected Jobs</h2>
                            <div className="job-cards-container" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {jobs.selectedJobs.map(selectedJob => (
                                    <div key={selectedJob._id} className="job-card selected-job" style={{ backgroundColor: '#fff7e6', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', padding: '20px', marginBottom: '20px', marginRight: '20px', width: '300px' }}>
                                        <h3 style={{ marginTop: 0, color: '#007bff', fontSize: '22px', marginBottom: '10px' }}>{selectedJob.title}</h3>
                                        <p style={{ margin: 0, fontSize: '16px', color: '#333' }}>Company: <span style={{ fontWeight: 'bold', color: '#007bff' }}>{selectedJob.Company}</span></p>
                                        <p style={{ margin: 0, fontSize: '16px', color: '#333' }}>Salary: <span style={{ fontWeight: 'bold', color: '#007bff' }}>{selectedJob.Salary}</span></p>
                                        <p style={{ margin: 0, fontSize: '16px', color: '#333', marginTop: '10px' }}>Status: <span style={{ fontWeight: 'bold', color: '#28a745' }}>Selected</span></p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Render not selected jobs */}
                    {jobs.notSelectedJobs&& jobs.notSelectedJobs.length > 0 && (
                        <div>
                            <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>Not Selected Jobs</h2>
                            <div className="job-cards-container" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {jobs.notSelectedJobs.map(notSelectedJob => (
                                    <div key={notSelectedJob._id} className="job-card" style={{ backgroundColor: '#fff7e6', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', padding: '20px', marginBottom: '20px', marginRight: '20px', width: '300px' }}>
                                    <h3 style={{ marginTop: 0, color: '#007bff', fontSize: '22px', marginBottom: '10px' }}>{notSelectedJob.title}</h3>
                                    <p style={{ margin: 0, fontSize: '16px', color: '#333' }}>Company: <span style={{ fontWeight: 'bold', color: '#007bff' }}>{notSelectedJob.Company}</span></p>
                                    <p style={{ margin: 0, fontSize: '16px', color: '#333' }}>Salary: <span style={{ fontWeight: 'bold', color: '#007bff' }}>{notSelectedJob.Salary}</span></p>
                                    <p style={{ margin: 0, fontSize: '16px', color: '#333', marginTop: '10px' }}>Status: <span style={{ fontWeight: 'bold', color: '#dc3545' }}>Not Selected</span></p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Render available jobs */}
                <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Available Jobs</h2>
                {jobs.availableJobs&& jobs.availableJobs.length > 0 ? (
                    <div>
                        <div className="job-cards-container" style={{ display: 'flex', flexWrap: 'wrap' }}>
                            {jobs.availableJobs.map(job => (
                                <div key={job._id} className="job-card" style={{ backgroundColor: '#f9f9f9', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', padding: '20px', marginBottom: '20px', marginRight: '20px' }}>
                                    <h3 style={{ marginTop: 0 }}>{job.title}</h3>
                                    <p style={{ margin: 0, fontSize: '16px', color: '#333' }}>Company: {job.Company}</p>
                                    <p style={{ margin: 0, fontSize: '16px', color: '#333' }}>Salary: {job.Salary}</p>
                                    {/* Extracting and formatting the deadline */}
                                    <p style={{ margin: 0, fontSize: '16px', color: '#333' }}>
                                        Deadline: {formatDeadline(job.expiretime)}
                                    </p>
                                    <button onClick={() => handleApply(job._id)} style={{ marginTop: '10px', padding: '8px 16px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Apply</button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p style={{ textAlign: 'center', marginBottom: '20px' }}>No available jobs</p>
                )}

                {/* Render applied jobs */}
                <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Applied Jobs</h2>
                {jobs.appliedJobs&&jobs.appliedJobs.length > 0 ? (
                    <div>
                        <div className="job-cards-container" style={{ display: 'flex', flexWrap: 'wrap' }}>
                            {jobs.appliedJobs.map(appliedJob => (
                                <div key={appliedJob._id} className="job-card" style={{ backgroundColor: '#f9f9f9', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', padding: '20px', marginBottom: '20px', marginRight: '20px' }}>
                                    <h3 style={{ marginTop: 0 }}>{appliedJob.title}</h3>
                                    <p style={{ margin: 0, fontSize: '16px', color: '#333' }}>Company: {appliedJob.Company}</p>
                                    <p style={{ margin: 0, fontSize: '16px', color: '#333' }}>Salary: {appliedJob.Salary}</p>
                                    <p>Status: Applied</p>
                                    {/* Render other job details */}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p style={{ textAlign: 'center', marginBottom: '20px' }}>No applied jobs</p>
                )}
            </div>
        )}
    </div>
);
}

