import { Issue, User, IssueStatus } from '../types';
import { MOCK_ISSUES } from '../data/mockIssues';

// Simulate latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const resolveDepartment = (category: string | undefined) => {
  if (category === 'Garbage') return 'Sanitation';
  if (category === 'Streetlight') return 'Electrical';
  return 'General';
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  await delay(800);
  console.log(`[FirebasePlaceholder] Logging in: ${email}`);
  
  // Simple mock logic for demo purposes
  if (email.includes('staff')) {
    return { id: 'staff1', name: 'Staff Member', email, role: 'staff', avatar: 'https://picsum.photos/200' };
  } else if (email.includes('admin')) {
    return { id: 'admin1', name: 'Admin User', email, role: 'admin', avatar: 'https://picsum.photos/200' };
  }
  
  return { id: 'user1', name: 'John Citizen', email, role: 'citizen', avatar: 'https://picsum.photos/200' };
};

export const registerUser = async (name: string, email: string): Promise<User> => {
  await delay(800);
  console.log(`[FirebasePlaceholder] Registering: ${name}, ${email}`);
  return { id: 'new_user', name, email, role: 'citizen' };
};

export const submitIssue = async (issueData: Partial<Issue>): Promise<Issue> => {
  await delay(1000);
  console.log('[FirebasePlaceholder] Submitting issue:', issueData);
  const department = resolveDepartment(issueData.category as Issue['category']);
  const newIssue: Issue = {
    id: `ISS-${Math.floor(Math.random() * 10000)}`,
    title: issueData.title || 'Untitled',
    description: issueData.description || '',
    category: issueData.category || ('' as any),
    status: IssueStatus.SUBMITTED,
    location: issueData.locationText || issueData.location || 'Unknown',
    locationText: issueData.locationText || issueData.location || 'Unknown',
    fullAddress: issueData.fullAddress || issueData.locationText || issueData.location || 'Unknown',
    street: issueData.street,
    locality: issueData.locality,
    city: issueData.city,
    state: issueData.state,
    pincode: issueData.pincode,
    country: issueData.country,
    landmark: issueData.landmark,
    lat: issueData.lat ?? 0,
    lng: issueData.lng ?? 0,
    department,
    createdBy: 'user1', // Mock user ID
    createdAt: new Date().toISOString(),
    imageUrl: issueData.imageUrl,
    beforeImageUrl: issueData.beforeImageUrl || issueData.imageUrl,
    afterImageUrl: issueData.afterImageUrl,
    resolutionImageUrl: issueData.resolutionImageUrl,
  };
  return newIssue;
};

export const fetchIssues = async (): Promise<Issue[]> => {
  await delay(500);
  console.log('[FirebasePlaceholder] Fetching all issues');
  // Return a copy to avoid mutation issues in mock
  return [...MOCK_ISSUES]; 
};

export const updateIssueStatus = async (issueId: string, newStatus: IssueStatus): Promise<void> => {
  await delay(500);
  console.log(`[FirebasePlaceholder] Updating issue ${issueId} to ${newStatus}`);
};

export const uploadImage = async (file: File): Promise<string> => {
  await delay(1500);
  console.log('[FirebasePlaceholder] Uploading image:', file.name);
  return URL.createObjectURL(file); // Return local blob for preview
};