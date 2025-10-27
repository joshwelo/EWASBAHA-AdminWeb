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
  const [categories, setCategories] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentGuideId, setCurrentGuideId] = useState(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [process, setProcess] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewGuide, setPreviewGuide] = useState(null);

  const guidesCollectionRef = collection(db, 'userGuides');
  const categoriesCollectionRef = collection(db, 'categories');

  const getGuides = async () => {
    const data = await getDocs(guidesCollectionRef);
    setGuides(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
  };

  const getCategories = async () => {
    const data = await getDocs(categoriesCollectionRef);
    setCategories(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
  };

  useEffect(() => {
    getGuides();
    getCategories();
  }, []);

  const handleCreateGuide = async () => {
    await addDoc(guidesCollectionRef, {
      title,
      subtitle,
      description,
      process,
      image,
      category,
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
      category,
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
    setCategory(guide.category);
  };

  const handleCreateCategory = async () => {
    await addDoc(categoriesCollectionRef, { name: newCategory });
    getCategories();
    setNewCategory('');
  };

  const handleUpdateCategory = async () => {
    const categoryDoc = doc(db, 'categories', currentCategoryId);
    await setDoc(categoryDoc, { name: newCategory });
    getCategories();
    setNewCategory('');
    setIsEditingCategory(false);
    setCurrentCategoryId(null);
  };

  const handleDeleteCategory = async (id) => {
    const categoryDoc = doc(db, 'categories', id);
    await deleteDoc(categoryDoc);
    getCategories();
  };

  const handleEditCategoryClick = (category) => {
    setIsEditingCategory(true);
    setCurrentCategoryId(category.id);
    setNewCategory(category.name);
  };

  const openPreview = (guide) => {
    setPreviewGuide(guide);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewGuide(null);
  };

  const clearForm = () => {
    setTitle('');
    setSubtitle('');
    setDescription('');
    setProcess('');
    setImage('');
    setCategory('');
  };

  const guidesByCategory = guides.reduce((acc, guide) => {
    const categoryName = categories.find((c) => c.id === guide.category)?.name || 'Uncategorized';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(guide);
    return acc;
  }, {});

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">User Guide Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
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
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
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
            {Object.keys(guidesByCategory).map((categoryName) => (
              <div key={categoryName} className="mb-8">
                <h3 className="text-xl font-bold mb-2">{categoryName}</h3>
                <div className="space-y-4">
                  {guidesByCategory[categoryName].map((guide) => (
                    <div key={guide.id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-xl font-bold">{guide.title}</h3>
                      <p className="text-md text-gray-600">{guide.subtitle}</p>
                      <div className="mt-4">
                        <button
                          onClick={() => openPreview(guide)}
                          className="bg-green-500 text-white px-3 py-1 rounded-lg mr-2 hover:bg-green-600 text-sm"
                        >
                          Preview
                        </button>
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
            ))}
          </div>
        </div>

        <div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">
              {isEditingCategory ? 'Edit Category' : 'Create Category'}
            </h2>
            <div className="flex items-center">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter category name"
              />
              {isEditingCategory ? (
                <>
                  <button
                    onClick={handleUpdateCategory}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg ml-2 hover:bg-blue-600"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingCategory(false);
                      setNewCategory('');
                      setCurrentCategoryId(null);
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg ml-2 hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCreateCategory}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg ml-2 hover:bg-blue-600"
                >
                  Create
                </button>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Existing Categories</h2>
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between border border-gray-200 rounded-lg p-2"
                >
                  <p>{cat.name}</p>
                  <div>
                    <button
                      onClick={() => handleEditCategoryClick(cat)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded-lg mr-2 hover:bg-yellow-600 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-sm mx-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold">Phone Preview</h3>
              <button onClick={closePreview} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 h-96 overflow-y-auto">
              <div className="border-2 border-gray-800 rounded-[2.5rem] h-full p-4 bg-white">
                <div className="flex flex-col h-full">
                  <div className="mb-4">
                    <h1 className="text-2xl font-bold">{previewGuide?.title}</h1>
                    <p className="text-md text-gray-600">{previewGuide?.subtitle}</p>
                  </div>
                  {previewGuide?.image && <img src={previewGuide.image} alt={previewGuide.title} className="mb-4 rounded-lg" />}
                  <div className="prose max-w-none flex-1 overflow-y-auto">
                    <p>{previewGuide?.description}</p>
                    <h4 className="font-bold mt-4">Process:</h4>
                    <div dangerouslySetInnerHTML={{ __html: previewGuide?.process.replace(/\n/g, '<br />') }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserGuide;