import React from 'react'
import { BrowserRouter,Route,Routes } from 'react-router-dom';
import Home from "./pages/Home";
import Login from './components/Login';
import StudentHome from './pages/StudentHome';
import AdminHome from './pages/AdminHome';
import NavbarAfterLogin from './components/NavbarAfterLogin';
import AdminPortal from './components/AdminPortal';
import AddStudent from './components/AddStudent'
import PostJob from './components/PostJob';
import PostResults from './components/PostResults';
import PostResultsHere from './components/PostResultsHere';
import CheckJobs from './components/CheckJobs';
import SeeResults from './components/SeeResults';
import UpdateGpa from './components/UpdateGpa';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home/>}></Route>
          <Route path="/login" element={<Login/>}></Route>
          <Route path="/studentHome" element={<StudentHome/>}></Route>
          <Route path="/adminHome" element={<AdminHome/>}></Route>
          <Route path="/navbarAfterLogin" element={<NavbarAfterLogin/>}></Route>
          <Route path="/adminPortal" element={<AdminPortal/>}></Route>
          <Route path="/addStudent" element={<AddStudent/>}></Route>
          <Route path="/postJob" element={<PostJob/>}></Route>
          <Route path="/postResults" element={<PostResults/>}></Route>
          <Route path="/postResultsHere" element={<PostResultsHere/>}></Route>
          <Route path="/checkJobs" element={<CheckJobs/>}></Route>
          <Route path="/seeResults" element={<SeeResults/>}></Route>
          <Route path="/updateGpa" element={<UpdateGpa/>}></Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
