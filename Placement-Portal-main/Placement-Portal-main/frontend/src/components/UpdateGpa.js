import React, { useState } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import NavbarAfterLogin from './NavbarAfterLogin';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx'; // Import XLSX library
import './PostResultsHere.css';

export default function UpdateGpa() {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
    const handleFileChange = (e) => {
        const uploadedFile = e.target.files[0];
        setFile(uploadedFile);
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
            const requiredHeaders = ["id", "name", "branch", "gpa"]; // Updated headers

            const hasRequiredHeaders = requiredHeaders.every(header => headerRow.includes(header));
            if (!hasRequiredHeaders) {
                toast.error("The Excel file must contain headers: id, name, branch, gpa");
                return;
            }

            try {
                for (let i = 1; i < worksheet.length; i++) { // Start from index 1 to skip header row
                    const [id, name, branch, gpa] = worksheet[i];
                    console.log(id)
                    const uploadGpaEndpoint = `${apiBaseUrl}/job/uploadGpa`;
                    const response = await axios.post(uploadGpaEndpoint, {
                        id,
                        name,
                        branch,
                        gpa
                    }, { withCredentials: true });

                    if (!response.data.success) {
                        console.log(response);
                        toast.error(`Error updating GPA for student with ID ${id}: ${response.data.message}`);
                    }
                }

                toast.success("All GPAs updated successfully");
                setTimeout(() => {
                    navigate("/adminHome");
                }, 1500);
            } catch (error) {
                console.error('Error updating GPAs:', error);
                toast.error("Failed to update some GPAs. Please try again.");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div>
            <NavbarAfterLogin />
            <Toaster />

            <div style={{ position: 'absolute', top: '100px', left: '30px' }}>
                <button onClick={() => navigate('/adminHome')} style={{ padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Back</button>
            </div>
            <br></br>
            <h1 style={{ textAlign: 'center' }}>Upload GPA</h1>
            <div className="file-upload-container">
                
                <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="file-input" />
                <button onClick={handleFileUpload} className="upload-button">Upload Excel File</button>
                <p className="note">Note: The Excel file must contain headers: id, name, branch, gpa</p>
            </div>
        </div>
    );
}
