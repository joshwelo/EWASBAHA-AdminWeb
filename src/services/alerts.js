import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { logAdminAction } from './adminHistory';

const ALERTS_COLLECTION = 'alerts';

function generateHumanReadableTimestamp() {
try {
// Asia/Manila is UTC+8; if unavailable, fallback to local
return new Date().toLocaleString('en-US', {
year: 'numeric',
month: 'long',
day: '2-digit',
hour: 'numeric',
minute: '2-digit',
second: '2-digit',
hour12: true,
timeZone: 'Asia/Manila'
}) + ' UTC+8';
} catch (e) {
return new Date().toISOString();
}
}

function convertFirestoreTimestamp(timestamp) {
if (!timestamp) return null;

// If it's already a string, return as is
if (typeof timestamp === 'string') return timestamp;

// If it's a Firestore timestamp object
if (timestamp.seconds) {
try {
return new Date(timestamp.seconds * 1000).toLocaleString('en-US', {
year: 'numeric',
month: 'long',
day: '2-digit',
hour: 'numeric',
minute: '2-digit',
second: '2-digit',
hour12: true,
timeZone: 'Asia/Manila'
}) + ' UTC+8';
} catch (e) {
return new Date(timestamp.seconds * 1000).toISOString();
}
}

// If it's a regular Date object
if (timestamp instanceof Date) {
return timestamp.toLocaleString('en-US', {
year: 'numeric',
month: 'long',
day: '2-digit',
hour: 'numeric',
minute: '2-digit',
second: '2-digit',
hour12: true,
timeZone: 'Asia/Manila'
}) + ' UTC+8';
}

return timestamp.toString();
}

export async function createAlert(alert) {
const collectionRef = collection(db, ALERTS_COLLECTION);
const payload = {
...alert,
sent: !!alert.sent,
timestamp: generateHumanReadableTimestamp(),
createdAt: serverTimestamp()
};
const newDoc = await addDoc(collectionRef, payload);
await logAdminAction('CREATE', ALERTS_COLLECTION, newDoc.id, { title: alert.title });
return { id: newDoc.id, ...payload };
}

export async function listAlerts() {
const collectionRef = collection(db, ALERTS_COLLECTION);
const q = query(collectionRef, orderBy('createdAt', 'desc'));
const snapshot = await getDocs(q);
return snapshot.docs.map(d => {
const data = d.data();
return { 
id: d.id, 
...data,
createdAt: convertFirestoreTimestamp(data.createdAt),
sentAt: convertFirestoreTimestamp(data.sentAt)
};
});
}

export async function updateAlert(alertId, updates) {
const docRef = doc(db, ALERTS_COLLECTION, alertId);
await updateDoc(docRef, updates);
await logAdminAction('UPDATE', ALERTS_COLLECTION, alertId, { updates });
return { id: alertId, ...updates };
}

export async function deleteAlert(alertId) {
const docRef = doc(db, ALERTS_COLLECTION, alertId);
await deleteDoc(docRef);
await logAdminAction('DELETE', ALERTS_COLLECTION, alertId);
return true;
}

export async function sendAlert(alertId) {
// Mark as sent and set sentAt timestamp
const result = await updateAlert(alertId, { sent: true, sentAt: serverTimestamp() });
await logAdminAction('SEND', ALERTS_COLLECTION, alertId);
return result;
}
