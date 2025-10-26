import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Sample emergency report data for testing
const sampleReports = [
  {
    userId: 'test_user_1',
    userName: 'John Doe',
    profileImageUrl: 'https://via.placeholder.com/50x50?text=JD',
    location: {
      latitude: 14.080778,
      longitude: 121.175306
    },
    addressString: '123 Main Street, Barangay Malvar, San Pablo City',
    tags: ['Rising Floodwater', 'Needs Rescue'],
    severityLevel: 5,
    caption: 'Water level is rising rapidly, need immediate assistance. Multiple families affected.',
    mediaUrl: 'https://via.placeholder.com/300x200?text=Flood+Image+1',
    mediaType: 'image',
    peopleAffected: true,
    status: 'pending',
    timestamp: new Date(),
    urgencyScore: 8,
    likeCount: 0,
    rankingScore: 0.8
  },
  {
    userId: 'test_user_2',
    userName: 'Jane Smith',
    profileImageUrl: 'https://via.placeholder.com/50x50?text=JS',
    location: {
      latitude: 14.081000,
      longitude: 121.175500
    },
    addressString: '456 Oak Street, Barangay Malvar, San Pablo City',
    tags: ['Fallen Tree', 'Road Blocked'],
    severityLevel: 4,
    caption: 'Large tree fell on the road, blocking traffic completely.',
    mediaUrl: 'https://via.placeholder.com/300x200?text=Tree+Image+1',
    mediaType: 'image',
    peopleAffected: false,
    status: 'pending',
    timestamp: new Date(),
    urgencyScore: 6,
    likeCount: 0,
    rankingScore: 0.6
  },
  {
    userId: 'test_user_3',
    userName: 'Mike Johnson',
    profileImageUrl: 'https://via.placeholder.com/50x50?text=MJ',
    location: {
      latitude: 14.082000,
      longitude: 121.176000
    },
    addressString: '789 Pine Street, Barangay Malvar, San Pablo City',
    tags: ['Needs Rescue', 'Rising Floodwater'],
    severityLevel: 3,
    caption: 'Family stranded due to flood waters, cannot evacuate safely.',
    mediaUrl: null,
    mediaType: null,
    peopleAffected: true,
    status: 'verified',
    verificationData: {
      verifiedBy: 'admin_user_id',
      verifiedAt: new Date().toISOString(),
      adminNotes: 'Verified through multiple reports and media evidence',
      isLegitimate: true
    },
    timestamp: new Date(),
    urgencyScore: 7,
    likeCount: 0,
    rankingScore: 0.7
  },
  {
    userId: 'test_user_4',
    location: {
      latitude: 14.083000,
      longitude: 121.177000,
      address: '321 Elm Street, Barangay Malvar',
      barangay: 'Malvar',
      municipality: 'San Pablo City'
    },
    reportType: 'rescue_needed',
    severity: 'critical',
    description: 'Elderly person trapped in flooded house, water level rising.',
    mediaUrls: ['https://via.placeholder.com/300x200?text=Rescue+Image+1'],
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    userId: 'test_user_5',
    location: {
      latitude: 14.084000,
      longitude: 121.178000,
      address: '654 Maple Street, Barangay Malvar',
      barangay: 'Malvar',
      municipality: 'San Pablo City'
    },
    reportType: 'flooding',
    severity: 'high',
    description: 'Flood waters reaching second floor of houses.',
    mediaUrls: ['https://via.placeholder.com/300x200?text=Flood+Image+2'],
    status: 'verified',
    verificationData: {
      verifiedBy: 'admin_user_id',
      verifiedAt: new Date().toISOString(),
      adminNotes: 'Confirmed by multiple sources',
      isLegitimate: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    userId: 'test_user_6',
    location: {
      latitude: 14.085000,
      longitude: 121.179000,
      address: '987 Cedar Street, Barangay Malvar',
      barangay: 'Malvar',
      municipality: 'San Pablo City'
    },
    reportType: 'fallen_tree',
    severity: 'low',
    description: 'Small branch fell, minor obstruction.',
    mediaUrls: [],
    status: 'invalid',
    verificationData: {
      verifiedBy: 'admin_user_id',
      verifiedAt: new Date().toISOString(),
      adminNotes: 'False report, no tree found at location',
      isLegitimate: false
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    userId: 'test_user_7',
    location: {
      latitude: 14.086000,
      longitude: 121.180000,
      address: '147 Birch Street, Barangay Malvar',
      barangay: 'Malvar',
      municipality: 'San Pablo City'
    },
    reportType: 'stranded',
    severity: 'medium',
    description: 'Vehicle stuck in flood waters, driver needs assistance.',
    mediaUrls: ['https://via.placeholder.com/300x200?text=Vehicle+Image+1'],
    status: 'resolved',
    verificationData: {
      verifiedBy: 'admin_user_id',
      verifiedAt: new Date().toISOString(),
      adminNotes: 'Rescue completed successfully',
      isLegitimate: true
    },
    resolvedAt: new Date().toISOString(),
    resolvedBy: 'admin_user_id',
    resolutionNotes: 'Driver rescued and vehicle towed to safety',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    userId: 'test_user_8',
    location: {
      latitude: 14.087000,
      longitude: 121.181000,
      address: '258 Spruce Street, Barangay Malvar',
      barangay: 'Malvar',
      municipality: 'San Pablo City'
    },
    reportType: 'flooding',
    severity: 'high',
    description: 'Sewer overflow causing health concerns in the area.',
    mediaUrls: ['https://via.placeholder.com/300x200?text=Sewer+Image+1'],
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    userId: 'test_user_9',
    location: {
      latitude: 14.088000,
      longitude: 121.182000,
      address: '369 Willow Street, Barangay Malvar',
      barangay: 'Malvar',
      municipality: 'San Pablo City'
    },
    reportType: 'rescue_needed',
    severity: 'critical',
    description: 'Child missing in flooded area, search and rescue needed.',
    mediaUrls: [],
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    userId: 'test_user_10',
    location: {
      latitude: 14.089000,
      longitude: 121.183000,
      address: '741 Poplar Street, Barangay Malvar',
      barangay: 'Malvar',
      municipality: 'San Pablo City'
    },
    reportType: 'fallen_tree',
    severity: 'medium',
    description: 'Tree branch blocking pedestrian walkway.',
    mediaUrls: ['https://via.placeholder.com/300x200?text=Tree+Image+2'],
    status: 'verified',
    verificationData: {
      verifiedBy: 'admin_user_id',
      verifiedAt: new Date().toISOString(),
      adminNotes: 'Verified and cleared by maintenance team',
      isLegitimate: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Function to generate test data
export const generateTestEmergencyReports = async () => {
  try {
    console.log('Generating test emergency reports...');
    
    for (const report of sampleReports) {
      await addDoc(collection(db, 'posts'), report);
      console.log(`Created test report: ${report.tags?.join(', ')} - Level ${report.severityLevel}`);
    }
    
    console.log('Test emergency reports generated successfully!');
    return { success: true, message: 'Test data generated successfully' };
  } catch (error) {
    console.error('Error generating test data:', error);
    return { success: false, message: 'Failed to generate test data' };
  }
};

// Function to clear test data
export const clearTestEmergencyReports = async () => {
  try {
    // Note: This would require implementing a delete function
    // For now, this is just a placeholder
    console.log('Test data clearing not implemented yet');
    return { success: true, message: 'Test data clearing not implemented yet' };
  } catch (error) {
    console.error('Error clearing test data:', error);
    return { success: false, message: 'Failed to clear test data' };
  }
};
