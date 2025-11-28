import React, { createContext, useContext, useEffect, useState } from 'react';
import { IssueRecord, listenToUserIssues } from '../services/issueService';
import { useAuth } from './AuthContext';

interface IssueContextValue {
  issues: IssueRecord[];
  loading: boolean;
}

const IssueContext = createContext<IssueContextValue>({ issues: [], loading: true });

export const IssueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setIssues([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = listenToUserIssues(user.uid, (records) => {
      setIssues(records);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  return <IssueContext.Provider value={{ issues, loading }}>{children}</IssueContext.Provider>;
};

export const useIssues = () => useContext(IssueContext);
