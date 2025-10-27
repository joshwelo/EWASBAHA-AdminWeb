import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';

const UserGuide = () => {
  const [guides, setGuides] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentGuideId, setCurrentGuideId] = useState(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [process, setProcess] = useState('');
  const [image, setImage] = useState('');

  const guidesCollectionRef = collection(db, 'userGuides');

  const getGuides = async () => {
    const data = await getDocs(guidesCollectionRef);
    setGuides(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
  };

  useEffect(() => {
    getGuides();
  }, []);

  const handleCreateGuide = async () => {
    await addDoc(guidesCollectionRef, {
      title,
      subtitle,
      description,
      process,
      image,
    });
    getGuides();
    clearForm();
  };

  const handleUpdateGuide = async () => {
    const guideDoc = doc(db, 'userGuides', currentGuideId);
    await setDoc(guideDoc, {
      title,
      subtitle,
      description,
      process,
      image,
    });
    getGuides();
    clearForm();
    setIsEditing(false);
    setCurrentGuideId(null);
  };

  const handleDeleteGuide = async (id) => {
    const guideDoc = doc(db, 'userGuides', id);
    await deleteDoc(guideDoc);
    getGuides();
  };

  const handleEditClick = (guide) => {
    setIsEditing(true);
    setCurrentGuideId(guide.id);
    setTitle(guide.title);
    setSubtitle(guide.subtitle);
    setDescription(guide.description);
    setProcess(guide.process);
    setImage(guide.image);
  };

  const clearForm = () => {
    setTitle('');
    setSubtitle('');
    setDescription('');
    setProcess('');
    setImage('');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">User Guide Management</h1>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">
          {isEditing ? 'Edit User Guide' : 'Create User Guide'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter subtitle"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Enter description"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Process (Steps)</label>
            <textarea
              value={process}
              onChange={(e) => setProcess(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="5"
              placeholder="Enter process steps, use numbering for each step"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Image (Optional)</label>
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter image URL"
            />
          </div>
        </div>
        <div className="mt-4">
          {isEditing ? (
            <>
              <button
                onClick={handleUpdateGuide}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg mr-2 hover:bg-blue-600"
              >
                Update Guide
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  clearForm();
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleCreateGuide}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Create Guide
            </button>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Existing User Guides</h2>
        <div className="space-y-4">
          {guides.map((guide) => (
            <div key={guide.id} className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-xl font-bold">{guide.title}</h3>
              <p className="text-md text-gray-600">{guide.subtitle}</p>
              <p className="mt-2">{guide.description}</p>
              <div className="mt-2">
                <h4 className="font-bold">Process:</h4>
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: guide.process.replace(/\n/g, '<br />') }} />
              </div>
              {guide.image && <img src={guide.image} alt={guide.title} className="mt-4 rounded-lg" />}
              <div className="mt-4">
                <button
                  onClick={() => handleEditClick(guide)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded-lg mr-2 hover:bg-yellow-600 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteGuide(guide.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserGuide;
