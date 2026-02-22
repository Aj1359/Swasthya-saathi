import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface UserData {
  name: string;
  gender: string;
  age: number;
  mood: string;
  aboutYourself: string;
  happinessIndex: number;
  healthIndex: number;
  occupation: string;
  country: string;
  collegeStressors: string[];
}

interface UserContextType {
  userData: UserData | null;
  setUserData: (data: UserData) => void;
  updateIndices: (happiness: number, health: number) => void;
  isOnboarded: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserDataState] = useState<UserData | null>(() => {
    const stored = localStorage.getItem('swasthyasaathi_user');
    return stored ? JSON.parse(stored) : null;
  });

  const setUserData = (data: UserData) => {
    setUserDataState(data);
    localStorage.setItem('swasthyasaathi_user', JSON.stringify(data));
  };

  const updateIndices = (happiness: number, health: number) => {
    if (userData) {
      const updated = { ...userData, happinessIndex: happiness, healthIndex: health };
      setUserDataState(updated);
      localStorage.setItem('swasthyasaathi_user', JSON.stringify(updated));
    }
  };

  return (
    <UserContext.Provider value={{ 
      userData, 
      setUserData, 
      updateIndices,
      isOnboarded: !!userData 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
