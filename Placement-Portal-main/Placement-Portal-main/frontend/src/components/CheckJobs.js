import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import NavbarAfterLogin from './NavbarAfterLogin';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx'; // Import XLSX library

export default function CheckJobs() {
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const [jobs, setJobs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch jobs from the backend when the component mounts
    getAllJobs();
  }, []);

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

  const getAllJobs = async () => {
    try {
      // Use the base URL to construct the full endpoint
      const getAllJobsByAdminEndpoint = `${apiBaseUrl}/job/getAllJobsByAdmin`;
      const response = await axios.get(getAllJobsByAdminEndpoint, { withCredentials: true });
      if (response.data.success) {
        setJobs(response.data.jobs);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error:', error.message);
      toast.error('Error retrieving jobs');
    }
  };

  const handleDownload = async (jobId, companyName, jobName) => {
    console.log('Downloading students list for job with ID:', jobId);
    try {
      // Use the base URL to construct the full endpoint
      const studentsAppliedEndpoint = `${apiBaseUrl}/job/getStudentsAppliedForJob`;
      const response = await axios.post(studentsAppliedEndpoint, { jobid: jobId }, { withCredentials: true });
      if (response.data.success) {
        const users = response.data.selectedUsers; // Assuming selectedUsers contains the user data
        console.log(users);
        if (users.length > 0) {
          const data = [['Id','Name', 'Branch', 'Email']]; // Initialize data array for Excel file
          users.forEach(user => {
            const { userId,name, branch, email } = user;
            data.push([userId,name, branch, email]); // Add user data to the array
          });
          const ws = XLSX.utils.aoa_to_sheet(data); // Convert data array to worksheet
          const wb = XLSX.utils.book_new(); // Create new workbook
          XLSX.utils.book_append_sheet(wb, ws, 'Students'); // Append worksheet to workbook
          XLSX.writeFile(wb, `${companyName}_${jobName}_Students.xlsx`); // Download Excel file with job and company name
        } else {
          toast.error('No students found for this job');
        }
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error:', error.message);
      toast.error('Error getting students list');
    }
  };

  return (
    <div>
      <NavbarAfterLogin />
      <Toaster />
      <div style={{ position: 'absolute', top: '100px', left: '30px' }}>
        <button onClick={() => navigate('/adminHome')} style={{ padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Back</button>
      </div>
      <div className="job-cards-container" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', margin: '100px' }}>
        {jobs.map(job => (
          <div key={job._id} className="job-card" style={{ width: '300px', margin: '10px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <h3>{job.title}</h3>
            <p>Company: {job.Company}</p>
            <p>Salary: {job.Salary}</p>
            <p>No Of Students applied: {job.User.length}</p>
            <p>Deadline: {formatDeadline(job.expiretime)}</p>
            <button onClick={() => handleDownload(job._id, job.Company, job.title)}>Download Students List</button>
          </div>
        ))}
      </div>
    </div>
  );
}
