import { doc, updateDoc, collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { logAdminAction } from './adminHistory';

// Verify a report as legitimate or invalid
export const verifyReport = async (reportId, adminId, isValid, adminNotes = '') => {
  try {
    const reportRef = doc(db, 'posts', reportId);
    const verificationData = {
      verifiedBy: adminId,
      verifiedAt: new Date().toISOString(),
      adminNotes,
      isLegitimate: isValid
    };

    const updateData = {
      status: isValid ? 'verified' : 'invalid',
      verificationData,
      updatedAt: new Date().toISOString()
    };

    await updateDoc(reportRef, updateData);
    
    // Log admin action
    await logAdminAction('VERIFY', 'posts', reportId, {
      isValid,
      adminNotes,
      verificationData
    });

    return { success: true, message: `Report ${isValid ? 'verified' : 'marked as invalid'} successfully` };
  } catch (error) {
    console.error('Error verifying report:', error);
    return { success: false, message: 'Failed to verify report' };
  }
};

// Batch verify multiple reports
export const batchVerifyReports = async (reportIds, adminId, isValid, adminNotes = '') => {
  const results = [];
  
  for (const reportId of reportIds) {
    const result = await verifyReport(reportId, adminId, isValid, adminNotes);
    results.push({ reportId, ...result });
  }
  
  return results;
};

// Get verification statistics
export const getVerificationStats = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'posts'));
    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const stats = {
      total: reports.length,
      pending: reports.filter(r => r.status === 'pending').length,
      verified: reports.filter(r => r.status === 'verified').length,
      invalid: reports.filter(r => r.status === 'invalid').length,
      resolved: reports.filter(r => r.status === 'resolved').length
    };
    
    return stats;
  } catch (error) {
    console.error('Error fetching verification stats:', error);
    return null;
  }
};

// Get reports by verification status
export const getReportsByStatus = async (status) => {
  try {
    const q = query(
      collection(db, 'posts'),
      where('status', '==', status),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Error fetching ${status} reports:`, error);
    return [];
  }
};

// Get reports by location
export const getReportsByLocation = async (addressString) => {
  try {
    const q = query(
      collection(db, 'posts'),
      where('addressString', '==', addressString),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching reports by location:', error);
    return [];
  }
};

// Mark report as resolved
export const resolveReport = async (reportId, adminId, resolutionNotes = '') => {
  try {
    const reportRef = doc(db, 'posts', reportId);
    const updateData = {
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
      resolvedBy: adminId,
      resolutionNotes,
      updatedAt: new Date().toISOString()
    };

    await updateDoc(reportRef, updateData);
    
    // Log admin action
    await logAdminAction('RESOLVE', 'posts', reportId, {
      resolutionNotes,
      resolvedBy: adminId
    });

    return { success: true, message: 'Report resolved successfully' };
  } catch (error) {
    console.error('Error resolving report:', error);
    return { success: false, message: 'Failed to resolve report' };
  }
};

// Get admin verification history
export const getAdminVerificationHistory = async (adminId) => {
  try {
    const q = query(
      collection(db, 'adminHistory'),
      where('admin.uid', '==', adminId),
      where('action', '==', 'VERIFY'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching admin verification history:', error);
    return [];
  }
};

// Create emergency report (for testing/admin use)
export const createEmergencyReport = async (reportData) => {
  try {
    const report = {
      ...reportData,
      status: 'pending',
      timestamp: new Date(),
      updatedAt: new Date().toISOString(),
      urgencyScore: calculateUrgencyScore(reportData)
    };

    const docRef = await addDoc(collection(db, 'posts'), report);
    
    // Log admin action
    await logAdminAction('CREATE', 'posts', docRef.id, {
      tags: reportData.tags,
      severityLevel: reportData.severityLevel
    });

    return { success: true, reportId: docRef.id, message: 'Emergency report created successfully' };
  } catch (error) {
    console.error('Error creating emergency report:', error);
    return { success: false, message: 'Failed to create emergency report' };
  }
};

// Helper function to calculate urgency score
const calculateUrgencyScore = (report) => {
  let score = 0;
  
  // Base score by severity level
  const severityLevel = report.severityLevel || 0;
  score += Math.min(severityLevel, 5); // Cap at 5 for severity level
  
  // Bonus for critical tags
  const criticalTags = ['Needs Rescue', 'Needs Medical', 'Rising Floodwater', 'Landslide'];
  if (report.tags) {
    const criticalTagCount = report.tags.filter(tag => criticalTags.includes(tag)).length;
    score += criticalTagCount * 2;
  }
  
  // Bonus for media evidence
  if (report.mediaUrl) {
    score += 1;
  }
  
  // Bonus for detailed description
  if (report.caption && report.caption.length > 50) {
    score += 1;
  }
  
  // Bonus for people affected
  if (report.peopleAffected) {
    score += 1;
  }
  
  return Math.min(score, 10); // Cap at 10
};
