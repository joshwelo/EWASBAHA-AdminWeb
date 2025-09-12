export { };
// Create a reusable admin history logging service
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

function generateHumanReadableTimestamp() {
	try {
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

export async function logAdminAction(action, collectionName, targetId, details = {}) {
	try {
		const user = auth.currentUser;
		const entry = {
			action, // e.g., 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'SEND'
			collection: collectionName,
			targetId: targetId || null,
			details: details || {},
			admin: user ? { uid: user.uid, email: user.email || null } : { uid: null, email: null },
			createdAt: serverTimestamp(),
			createdAtHuman: generateHumanReadableTimestamp()
		};
		await addDoc(collection(db, 'adminHistory'), entry);
	} catch (e) {
		// Do not block primary flow on logging errors
		console.error('Failed to log admin action', e);
	}
} 