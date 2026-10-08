import React from 'react'
import NavbarAfterLogin from '../components/NavbarAfterLogin';
import JobPortalOfStudent from '../components/JobPortalOfStudent';
import { useUser } from "../user-context";
export default function StudentHome() {
  const { user } = useUser();
  return (
    <div>
      {user&& (
        <>
          <NavbarAfterLogin/>
          <JobPortalOfStudent/>
        </>
      )}
    </div>
  )
}
