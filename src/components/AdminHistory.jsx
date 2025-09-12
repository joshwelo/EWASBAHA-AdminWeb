import React, { useEffect, useState } from 'react';
import Layout from './Layout';
import { collection, getDocs, orderBy, query, where, documentId } from 'firebase/firestore';
import { db } from '../firebase';

const AdminHistory = () => {
	const [entries, setEntries] = useState([]);
	const [loading, setLoading] = useState(false);
	const [userIdToName, setUserIdToName] = useState({});
	const [expandedDetailsByEntryId, setExpandedDetailsByEntryId] = useState({});

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			try {
				const qy = query(collection(db, 'adminHistory'), orderBy('createdAt', 'desc'));
				const snap = await getDocs(qy);
				const loadedEntries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
				setEntries(loadedEntries);

				// Fetch user names for any entries targeting users
				const userIds = Array.from(new Set(
					loadedEntries
						.filter(e => e.collection === 'users' && e.targetId)
						.map(e => e.targetId)
				));
				if (userIds.length > 0) {
					const idToName = {};
					for (let i = 0; i < userIds.length; i += 10) {
						const chunk = userIds.slice(i, i + 10);
						const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', chunk));
						const usersSnap = await getDocs(usersQuery);
						usersSnap.forEach(doc => {
							const data = doc.data();
							idToName[doc.id] = data?.userName || data?.username || data?.name || doc.id;
						});
					}
					setUserIdToName(idToName);
				}
			} catch (e) {
				console.error('Failed to load admin history', e);
			} finally {
				setLoading(false);
			}
		};
		load();
	}, []);

	const toggleDetails = (entryId) => {
		setExpandedDetailsByEntryId(prev => ({ ...prev, [entryId]: !prev[entryId] }));
	};

	return (
		<Layout>
			<div className="w-full h-full">
				<div className="px-6 py-6">
					<div className="flex flex-wrap justify-between gap-3">
						<div className="flex flex-col gap-3">
							<p className="text-[#111418] tracking-light text-[32px] font-bold leading-tight">Admin History</p>
							<p className="text-[#60758a] text-sm font-normal leading-normal">Audit log of admin CRUD actions across the system.</p>
						</div>
					</div>
				</div>

				<div className="px-6 pb-6">
					<div className="bg-white border border-[#f0f2f5] rounded-lg">
						<div className="p-4 border-b border-[#f0f2f5] flex items-center justify-between">
							<h3 className="text-base font-semibold text-[#111418]">Entries</h3>
							{loading && <span className="text-sm text-[#60758a]">Loading...</span>}
						</div>
						<div className="divide-y divide-[#f0f2f5]">
							{entries.length === 0 && !loading && (
								<div className="p-4 text-sm text-[#60758a]">No history yet.</div>
							)}
							{entries.map(entry => (
								<div key={entry.id} className="p-4 flex items-start gap-4">
									<div className="shrink-0 w-10 h-10 rounded-lg bg-[#f0f2f5] flex items-center justify-center text-sm font-bold text-[#111418]">
										{(entry.action || '?')[0]}
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex flex-wrap items-center gap-2 text-sm">
											<span className="font-semibold text-[#111418]">{entry.action}</span>
											<span className="text-[#60758a]">on</span>
											<span className="font-mono text-[#111418]">{entry.collection}</span>
											{entry.targetId && (
												<>
													<span className="text-[#60758a]">{entry.collection === 'users' ? 'userName' : 'id'}</span>
													<span className="font-mono text-[#111418] truncate">{entry.collection === 'users' ? (userIdToName[entry.targetId] || entry.targetId) : entry.targetId}</span>
												</>
											)}
										</div>
										<div className="mt-1 text-xs text-[#60758a]">
											<span>{entry.createdAtHuman || ''}</span>
											{entry.admin?.email && <span className="ml-2">by {entry.admin.email}</span>}
										</div>
										{entry.details && Object.keys(entry.details || {}).length > 0 && (
											<div className="mt-2">
												<button
													className="text-xs text-[#0ea5e9] hover:underline"
													onClick={() => toggleDetails(entry.id)}
												>
													{expandedDetailsByEntryId[entry.id] ? 'Hide details' : 'Show details'}
												</button>
												{expandedDetailsByEntryId[entry.id] && (
													<pre className="mt-2 p-3 bg-[#f8fafc] border border-[#eef2f7] rounded-lg text-xs overflow-auto max-h-48">{JSON.stringify(entry.details, null, 2)}</pre>
												)}
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
};

export default AdminHistory; 