import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from "../user-context";
import { Toaster } from 'react-hot-toast';
import NavbarAfterLogin from './NavbarAfterLogin';
import { useNavigate } from 'react-router-dom';

const SeeResults = () => {
  const { jobId } = useUser();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [nameOfJob,setNameOfJob]=useState();
  const [company,setNameOfCompany]=useState();
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    if (jobId) {
      fetchSelectedUsers();
    }
  }, [jobId]); // Corrected the dependency array

  const fetchSelectedUsers = async () => {
    try {
      const getStudentsSelectedForJobEndpoint = `${apiBaseUrl}/job/getStudentsSelectedForJob`;
      const response = await axios.post(getStudentsSelectedForJobEndpoint, { jobid: jobId },{withCredentials:true});
      console.log(response)
      if (response.data.success) {
        setSelectedUsers(response.data.selectedUsers);
        setNameOfJob(response.data.nameOfJob);
        setNameOfCompany(response.data.company);
      } else {
        console.error('Failed to fetch selected users:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching selected users:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Toaster />
      <NavbarAfterLogin />
      
      <div style={{ position: 'absolute', top: '15%', left: '5%' }}>
        <button onClick={() => navigate('/postResults')} style={{ backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Back</button>
      </div>
      
      <div style={{ margin: '100px' }}>
        <div style={{ border: '1px solid #ccc', borderRadius: '5px', overflowX: 'auto' }}>
          <h2 style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderBottom: '1px solid #ccc', borderTopLeftRadius: '5px', borderTopRightRadius: '5px' }}>Selected Users for the Job</h2>
          
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div>
                <h3>Name Of Company :{company}</h3>
                <h4>Name Of Job :{nameOfJob}</h4>
                
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f0f0f0', borderBottom: '1px solid #ccc' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>User ID</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Branch</th>
                    </tr>
                </thead>
                <tbody>
                    {selectedUsers.map(user => (
                    <tr key={user.userId} style={{ borderBottom: '1px solid #ccc' }}>
                        <td style={{ padding: '10px' }}>{user.name}</td>
                        <td style={{ padding: '10px' }}>{user.email}</td>
                        <td style={{ padding: '10px' }}>{user.userId}</td>
                        <td style={{ padding: '10px' }}>{user.branch}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeeResults;
