import React from 'react'
import NavbarAfterLogin from '../components/NavbarAfterLogin'
import { useUser } from "../user-context";
import AdminPortal from '../components/AdminPortal';
export default function AdminHome() {
  const { user } = useUser();
  return (
    <div>
      {user&& user.role==='Admin' && 
        <div>
          <NavbarAfterLogin/>
          <AdminPortal/>
        </div>
      }
      
    </div>
  )
}
