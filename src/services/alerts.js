import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

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

export async function createAlert(alert) {
	const collectionRef = collection(db, ALERTS_COLLECTION);
	const payload = {
		...alert,
		sent: !!alert.sent,
		timestamp: generateHumanReadableTimestamp(),
		createdAt: serverTimestamp()
	};
	const newDoc = await addDoc(collectionRef, payload);
	return { id: newDoc.id, ...payload };
}

export async function listAlerts() {
	const collectionRef = collection(db, ALERTS_COLLECTION);
	const q = query(collectionRef, orderBy('createdAt', 'desc'));
	const snapshot = await getDocs(q);
	return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateAlert(alertId, updates) {
	const docRef = doc(db, ALERTS_COLLECTION, alertId);
	await updateDoc(docRef, updates);
	return { id: alertId, ...updates };
}

export async function deleteAlert(alertId) {
	const docRef = doc(db, ALERTS_COLLECTION, alertId);
	await deleteDoc(docRef);
	return true;
}

export async function sendAlert(alertId) {
	// Mark as sent and set sentAt timestamp
	return updateAlert(alertId, { sent: true, sentAt: serverTimestamp() });
} 