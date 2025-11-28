export type UserRole = 'citizen' | 'staff' | 'admin';

export enum IssueStatus {
  SUBMITTED = 'Submitted',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved'
}

export enum IssueCategory {
  POTHOLE = 'Pothole',
  GARBAGE = 'Garbage',
  STREETLIGHT = 'Streetlight',
  WATER_LEAKAGE = 'Water Leakage',
  OTHERS = 'Others'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  location?: string;
  locationText?: string;
  fullAddress?: string;
  street?: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  landmark?: string;
  lat?: number;
  lng?: number;
  department?: string;
  imageUrl?: string;
  resolutionImageUrl?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  createdBy: string; // User ID
  createdAt: string; // ISO Date
  assignedTo?: string; // Staff ID
  upvotes?: number;
  upvotedBy?: string[];
}