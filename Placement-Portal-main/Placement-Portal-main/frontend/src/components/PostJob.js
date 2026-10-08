import React, { useState } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import NavbarAfterLogin from './NavbarAfterLogin';
import moment from 'moment';

const PostJob = () => {
    const navigate = useNavigate();
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
    const [formData, setFormData] = useState({
        title: '',
        Company: '',
        Salary: '',
        branch: [],
        deadline: '2024-05-11T15:40:00Z', // Add deadline to the initial state
        cgpa: '' // Add cgpa to the initial state
    });

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        if (checked) {
            setFormData({ ...formData, branch: [...formData.branch, name] });
        } else {
            setFormData({ ...formData, branch: formData.branch.filter(item => item !== name) });
        }
    };

    const handleDeadlineChange = (e) => {
        const { value } = e.target;
        setFormData({ ...formData, deadline: value });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Check if all fields are filled
        if (!formData.title || !formData.Company || !formData.Salary || formData.branch.length === 0 || !formData.deadline || !formData.cgpa) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            // Convert the deadline to the required format
            let formattedDeadline = moment(formData.deadline).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
            console.log(formattedDeadline)
            const payload = { ...formData, expiretime: formattedDeadline };

            console.log(payload);
            const createJobEndpoint = `${apiBaseUrl}/job/createJob`;
            const result = await axios.post(createJobEndpoint, payload, { withCredentials: true });
            if (result.data.success) {
                console.log(result);
                toast.success('Job posted successfully', { duration: 1500 });
                setFormData({ // Clear input fields after successful submission
                    title: '',
                    Company: '',
                    Salary: '',
                    branch: [],
                    deadline: '', // Reset deadline to default value
                    cgpa: '' // Reset cgpa to default value
                });
            } else {
                toast.error('Failed to post job');
            }
        } catch (error) {
            console.error('Error posting job:', error);
            toast.error('An error occurred while posting job');
        }
    };

    return (
        <div>
            <NavbarAfterLogin />
            <Toaster />
            <div style={{ position: 'absolute', top: '100px', left: '30px' }}>
                <button onClick={() => navigate('/adminHome')} style={{ padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Back</button>
            </div>
            <h2 style={{ textAlign: 'center', margin: '0 auto', marginTop: '20px' }}>Post a Job</h2>
            <form onSubmit={handleSubmit} style={{ width: '80%', maxWidth: '400px', margin: '0 auto' }}>
                <div style={{ marginBottom: '20px' }}>
                    <label>Title</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label>Company</label>
                    <input type="text" name="Company" value={formData.Company} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label>Salary</label>
                    <input type="text" name="Salary" value={formData.Salary} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label>Deadline</label>
                    <input type="datetime-local" name="deadline" value={formData.deadline} onChange={handleDeadlineChange} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label>CGPA</label>
                    <input type="text" name="cgpa" value={formData.cgpa} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label>Branch</label>
                    <div>
                        <label><input type="checkbox" name="cse" checked={formData.branch.includes("cse")} onChange={handleCheckboxChange} /> CSE</label>
                    </div>
                    <div>
                        <label><input type="checkbox" name="it" checked={formData.branch.includes("it")} onChange={handleCheckboxChange} /> IT</label>
                    </div>
                    <div>
                        <label><input type="checkbox" name="ece" checked={formData.branch.includes("ece")} onChange={handleCheckboxChange} /> ECE</label>
                    </div>
                </div>
                <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Submit</button>
            </form>
        </div>
    );
};

export default PostJob;
