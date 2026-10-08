import { createContext, useState, useContext } from "react";

const UserContext = createContext({});

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [jobId, setJobId] = useState(null); // Add jobId state

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  const setJob = (id) => {
    setJobId(id);
  };

  return (
    <UserContext.Provider value={{ user, login, logout, jobId, setJob }}> {/* Provide jobId and setJob */}
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
