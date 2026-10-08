import React, { useState } from 'react'
import { Link } from 'react-router-dom';
import './AdminPortal.css'
import 'bootstrap/dist/css/bootstrap.min.css';

export default function AdminPortal() {
    const [postResults,setPostResults]=useState(false);
  return (
    <div className="container">
            <div className="row">
                <div className="col-lg-6 mb-4">
                    <div className="box box1">
                        <h3>Add Student</h3>
                        <Link to="/addStudent" className="btn btn-primary">Add</Link>
                    </div>
                </div>
                <div className="col-lg-6 mb-4">
                    <div className="box box2">
                        <h3>Post Job</h3>
                        <Link to="/postJob" className="btn btn-primary">Post</Link>
                    </div>
                </div>
            </div>
            
            <div className="row">
                <div className="col-lg-6 mb-4">
                    <div className="box box3">
                        <h3>Post Results</h3>
                        <Link to="/postResults" className="btn btn-primary">Go to Post Results</Link>
                    </div>
                </div>
                <div className="col-lg-6 mb-4">
                    <div className="box box4">
                        <h3>Check the Jobs</h3>
                        <Link to="/checkJobs" className="btn btn-primary">Go to Download Students List</Link>
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="col-lg-6 mb-4">
                    <div className="box box1">
                        <h3>Update gpa of students</h3>
                        <Link to="/updateGpa" className="btn btn-primary">Go to Update GPA</Link>
                    </div>
                </div>
                
            </div>
        </div>
  )
}
