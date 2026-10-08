import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useUser } from "../user-context";
import './PostResultsHere.css'; // Import the CSS file
import NavbarAfterLogin from './NavbarAfterLogin';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const PostResultsHere = () => {
    const { jobId } = useUser();
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const navigate = useNavigate();
    const [jobName, setJobName] = useState("");
    const [company, setCompany] = useState("");
    const [error, setError] = useState("");
    const [file, setFile] = useState(null);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
    
    
    const fetchSelectedUsers = useCallback(async () => {
        try {
            const getStudentsAppliedForJobEndpoint = `${apiBaseUrl}/job/getStudentsAppliedForJob`;
            const response = await axios.post(getStudentsAppliedForJobEndpoint, { jobid: jobId }, { withCredentials: true });
            if (response.data.success) {
                setSelectedUsers(response.data.selectedUsers);
                setJobName(response.data.nameOfJob);
                setCompany(response.data.company);
            } else {
                setError("Failed to fetch selected users.");
            }
        } catch (error) {
            console.error('Error fetching selected users:', error);
            setError('Error fetching selected users.');
        } finally {
            setLoading(false);
        }
    }, [jobId]);

    useEffect(() => {
        fetchSelectedUsers();
    }, [fetchSelectedUsers]);

    const handleCheckboxChange = (userId) => {
        const user = selectedUsers.find(user => user.userId === userId);
        if (!user.selected) {
            const updatedSelectedUserIds = selectedUserIds.includes(userId)
                ? selectedUserIds.filter(id => id !== userId)
                : [...selectedUserIds, userId];
            setSelectedUserIds(updatedSelectedUserIds);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        // const selectedStudents = selectedUsers.filter(user => selectedUserIds.includes(user.userId));
    setShowConfirmationModal(true);
   
        
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleFileUpload = async () => {
        if (!file) {
            toast.error('Please select a file to upload');
            return;
        }
    
        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
    
            const headerRow = worksheet[0].map(header => header.toLowerCase());
            const requiredHeaders = ["id", "name", "email", "branch"];
    
            const hasRequiredHeaders = requiredHeaders.every(header => headerRow.includes(header));
            if (!hasRequiredHeaders) {
                toast.error("The Excel file must contain headers: User id, name, email, branch");
                return;
            }
    
            const idIndex = headerRow.indexOf("id");
            const userIds = worksheet.slice(1).map(row => row[idIndex]);
    
            setSelectedUserIds(userIds);
            setShowConfirmationModal(true); // Show the confirmation modal after setting the selected user IDs
        };
        reader.readAsArrayBuffer(file);
    };
    

    const handleSubmissionConfirmation = async () => {
        setShowConfirmationModal(false);
        
        try {
            const uploadResultsOfJobEndpoint = `${apiBaseUrl}/job/uploadResultsOfJob`;
            const response = await axios.post(uploadResultsOfJobEndpoint, {
                jobid: jobId,
                selectedUserIds: selectedUserIds
            }, { withCredentials: true });

            if (response.data.success) {
                toast.success("Upload successful", { duration: 1500 });
                setTimeout(() => {
                    navigate("/postResults");
                }, 1500);
            } else {
                setError("Failed to upload results.");
                toast.error("Failed to upload. Please try again.");
            }
        } catch (error) {
            console.error('Error submitting selected users:', error);
            toast.error("Failed to upload. Please try again.");
        }
    };

    return (
        <div className="post-results-container">
            <Toaster />
            <NavbarAfterLogin />
            <div style={{ position: 'absolute', top: '100px', left: '30px' }}>
                <button onClick={() => navigate('/postResults')} style={{ padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Back</button>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <form onSubmit={handleSubmit} className="upload-form" style={{ margin: '100px' }}>
                    <h2>Company: {company}</h2>
                    <h2>Job Role: {jobName}</h2>
                    <h3>Selected Students Upload for Job:</h3>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>User ID</th>
                                    <th>Select</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedUsers.map(user => (
                                    <tr key={user.userId}>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>{user.userId}</td>
                                        <td>
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    value={user.userId}
                                                    checked={selectedUserIds.includes(user.userId)}
                                                    onChange={() => handleCheckboxChange(user.userId)}
                                                />
                                                <span className="checkmark"></span>
                                            </label>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="button-container">
                        <button type="submit" className="submit-button">Submit Selected Students</button>
                    </div>
                </form>
            )}

            
              
            {/* Confirmation Modal */}
            {showConfirmationModal && (
                <div className="confirmation-modal">
                    <div className="modal-content">
                        <h2>Confirm Submission</h2>
                        <div className="modal-body">
                            <p>Number of selected students: {selectedUserIds.length}</p>
                            <table>
                                <thead>
                                    <tr>
                                        <th>User ID</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedUsers
                                        .filter(user => selectedUserIds.includes(user.userId)) // Filter selected users
                                        .map(user => (
                                            <tr key={user.userId}>
                                                <td>{user.userId}</td>
                                                <td>{user.name}</td>
                                                <td>{user.email}</td>
                                            </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="modal-footer">
                            <button onClick={handleSubmissionConfirmation} className="confirm-button">Confirm</button>
                            <button onClick={() => setShowConfirmationModal(false)} className="cancel-button">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="file-upload-container">
                <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="file-input" />
                <button onClick={handleFileUpload} className="upload-button">Upload Excel File</button>
                <p className="note">Note: The Excel file must contain headers: id, name, email, branch</p>
            </div>
        </div>
    );
};

export default PostResultsHere;
