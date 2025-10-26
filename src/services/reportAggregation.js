import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

// Calculate consensus score based on nearby reports
export const calculateLocationConsensus = (targetLocation, allReports, radiusKm = 1) => {
  const nearbyReports = allReports.filter(report => {
    if (!report.location || !targetLocation) return false;
    const distance = calculateDistance(
      targetLocation.latitude,
      targetLocation.longitude,
      report.location.latitude,
      report.location.longitude
    );
    return distance <= radiusKm;
  });

  if (nearbyReports.length === 0) return { consensusScore: 0, nearbyCount: 0, requiresVerification: false };

  // Calculate consensus based on tags and severity levels
  const allTags = nearbyReports.flatMap(r => r.tags || []);
  const severities = nearbyReports.map(r => r.severityLevel);
  
  // Count occurrences
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {});

  const severityCounts = severities.reduce((acc, severity) => {
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {});

  // Calculate consensus score (0-1)
  const totalReports = nearbyReports.length;
  const maxTagCount = Math.max(...Object.values(tagCounts), 0);
  const maxSeverityCount = Math.max(...Object.values(severityCounts), 0);
  
  const tagConsensus = maxTagCount / totalReports;
  const severityConsensus = maxSeverityCount / totalReports;
  const consensusScore = (tagConsensus + severityConsensus) / 2;

  return {
    consensusScore,
    nearbyCount: nearbyReports.length,
    requiresVerification: nearbyReports.length >= 10, // Minimum 10 reports for verification
    nearbyReports
  };
};

// Group reports by location (addressString)
export const groupReportsByLocation = (reports) => {
  const grouped = reports.reduce((acc, report) => {
    if (!report.location) return acc;
    
    const key = report.addressString || 'Unknown Location';
    
    if (!acc[key]) {
      acc[key] = {
        locationKey: key,
        location: report.location,
        reports: [],
        totalReports: 0,
        verifiedReports: 0,
        pendingReports: 0,
        invalidReports: 0,
        reportTypes: {},
        severityLevels: {},
        consensusScore: 0,
        requiresVerification: false
      };
    }
    
    acc[key].reports.push(report);
    acc[key].totalReports++;
    
    // Count by status
    if (report.status === 'verified') acc[key].verifiedReports++;
    else if (report.status === 'pending') acc[key].pendingReports++;
    else if (report.status === 'invalid') acc[key].invalidReports++;
    
    // Count by tags
    if (report.tags) {
      report.tags.forEach(tag => {
        acc[key].reportTypes[tag] = (acc[key].reportTypes[tag] || 0) + 1;
      });
    }
    
    // Count by severity level
    const severityLevel = report.severityLevel || 0;
    acc[key].severityLevels[severityLevel] = (acc[key].severityLevels[severityLevel] || 0) + 1;
    
    return acc;
  }, {});

  // Calculate consensus for each location
  Object.values(grouped).forEach(locationGroup => {
    const consensus = calculateLocationConsensus(
      locationGroup.location,
      locationGroup.reports
    );
    locationGroup.consensusScore = consensus.consensusScore;
    locationGroup.requiresVerification = consensus.requiresVerification;
  });

  return grouped;
};

// Get reports requiring verification (10+ nearby reports)
export const getReportsRequiringVerification = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'posts'));
    const allReports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const pendingReports = allReports.filter(report => report.status === 'pending');
    const reportsWithConsensus = pendingReports.map(report => {
      const consensus = calculateLocationConsensus(report.location, allReports);
      return {
        ...report,
        aggregationData: {
          nearbyReports: consensus.nearbyCount,
          consensusScore: consensus.consensusScore,
          requiresVerification: consensus.requiresVerification
        }
      };
    });

    return reportsWithConsensus.filter(report => report.aggregationData.requiresVerification);
  } catch (error) {
    console.error('Error fetching reports requiring verification:', error);
    return [];
  }
};

// Get location summary for a specific area
export const getLocationSummary = async (addressString) => {
  try {
    const q = query(
      collection(db, 'posts'),
      where('addressString', '==', addressString)
    );
    
    const snapshot = await getDocs(q);
    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (reports.length === 0) {
      return {
        locationKey: addressString,
        location: null,
        totalReports: 0,
        verifiedReports: 0,
        pendingReports: 0,
        invalidReports: 0,
        consensusScore: 0,
        requiresVerification: false,
        reportTypes: {},
        severityLevels: {}
      };
    }

    const grouped = groupReportsByLocation(reports);
    
    return grouped[addressString] || {
      locationKey: addressString,
      location: null,
      totalReports: 0,
      verifiedReports: 0,
      pendingReports: 0,
      invalidReports: 0,
      consensusScore: 0,
      requiresVerification: false,
      reportTypes: {},
      severityLevels: {}
    };
  } catch (error) {
    console.error('Error fetching location summary:', error);
    return null;
  }
};

// Calculate urgency score for a report
export const calculateUrgencyScore = (report) => {
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
