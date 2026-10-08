import React, { useState } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import NavbarAfterLogin from './NavbarAfterLogin';

export default function AddStudent() {
    // Access the environment variable
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '12345',
        role: "Student",
        branch: 'cse', // Set default value
        cgpa: '' // Add cgpa to the initial state
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.password || !formData.cgpa || !formData.branch) {
            toast.error('Please fill in all fields');
            return;
        }
        try {
            const userSignUpEndpoint = `${apiBaseUrl}/user/signup`;
            const result = await axios.post(userSignUpEndpoint, formData, { withCredentials: true });
            if (result.data.success) {
                toast.success('Student registered successfully', { duration: 1500 });
                setFormData({ // Clear input fields after successful submission
                    name: '',
                    email: '',
                    password: '12345',
                    role: "Student",
                    branch: 'cse', // Reset branch to default value
                    cgpa: '' // Reset cgpa to default value
                });
            } else {
                toast.error("Try again");
            }
        } catch (error) {
            console.error('Error registering student:', error);
            toast.error(error.response?.data?.message || 'An error occurred while registering student');
        }
    };

    return (
        <div className="container">
            <Toaster />
            <NavbarAfterLogin />
            <h2 className="text-center mb-4">Student Registration Form</h2>
            <button type="button" className="btn btn-secondary mb-3" onClick={() => navigate("/adminHome")}>Back</button>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="name" className="form-label">Name</label>
                    <input type="text" className="form-control" id="name" name="name" value={formData.name} onChange={handleChange} />
                </div>
                <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input type="email" className="form-control" id="email" name="email" value={formData.email} onChange={handleChange} />
                </div>
                <div className="mb-3">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input type="password" className="form-control" id="password" name="password" value={formData.password} onChange={handleChange} />
                </div>
                <div className="mb-3">
                    <label htmlFor="branch" className="form-label">Branch</label>
                    <select className="form-select" id="branch" name="branch" value={formData.branch} onChange={handleChange}>
                        <option value="cse">CSE</option>
                        <option value="it">IT</option>
                        <option value="ece">ECE</option>
                    </select>
                </div>
                <div className="mb-3">
                    <label htmlFor="cgpa" className="form-label">CGPA</label>
                    <input type="text" className="form-control" id="cgpa" name="cgpa" value={formData.cgpa} onChange={handleChange} />
                </div>
                <button type="submit" className="btn btn-primary me-2">Submit</button>
            </form>
        </div>
    );
}
