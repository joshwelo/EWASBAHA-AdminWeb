import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import Layout from './Layout';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// --- SVG Icons ---
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);

const PreviewIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
);

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const UserGuide = () => {
  const [guides, setGuides] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Modals
  const [isGuideModalOpen, setGuideModalOpen] = useState(false);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [isPreviewModalOpen, setPreviewModalOpen] = useState(false);

  // Forms
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [currentGuideId, setCurrentGuideId] = useState(null);
  const [currentCategoryId, setCurrentCategoryId] = useState(null);
  const [previewGuide, setPreviewGuide] = useState(null);
  
  // Form Fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState(['']); // Changed from process to steps
  const [image, setImage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');

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

  const clearForm = () => {
    setTitle('');
    setSubtitle('');
    setDescription('');
    setSteps(['']);
    setImage('');
    setImageFile(null);
    setCategory('');
    setCurrentGuideId(null);
    setIsEditing(false);
  };

  const openGuideModal = (guide = null) => {
    if (guide) {
      setIsEditing(true);
      setCurrentGuideId(guide.id);
      setTitle(guide.title);
      setSubtitle(guide.subtitle);
      setDescription(guide.description);
      setSteps(guide.process && Array.isArray(guide.process) ? guide.process : ['']);
      setImage(guide.image);
      setCategory(guide.category);
    } else {
      clearForm();
    }
    setGuideModalOpen(true);
  };

  const closeGuideModal = () => {
    clearForm();
    setGuideModalOpen(false);
  };

  const handleImageChange = (e) => {
      if (e.target.files[0]) {
          setImageFile(e.target.files[0]);
      }
  }

  const handleStepChange = (index, event) => {
    const newSteps = [...steps];
    newSteps[index] = event.target.value;
    setSteps(newSteps);
  };

  const addStep = () => {
    setSteps([...steps, '']);
  };

  const removeStep = (index) => {
    if (steps.length > 1) {
        const newSteps = steps.filter((_, i) => i !== index);
        setSteps(newSteps);
    }
  };

  const handleGuideSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    let imageUrl = image;
    if (imageFile) {
        const imageRef = ref(storage, `user-guides/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
    }

    const guideData = { title, subtitle, description, process: steps.filter(s => s.trim() !== ''), image: imageUrl, category };
    
    if (isEditing) {
      const guideDoc = doc(db, 'userGuides', currentGuideId);
      await setDoc(guideDoc, guideData);
    } else {
      await addDoc(guidesCollectionRef, guideData);
    }

    getGuides();
    setIsUploading(false);
    closeGuideModal();
  };

  const handleDeleteGuide = async (id) => {
    if (window.confirm("Are you sure you want to delete this guide?")) {
        const guideDoc = doc(db, 'userGuides', id);
        await deleteDoc(guideDoc);
        getGuides();
    }
  };

  const openCategoryModal = (cat = null) => {
      if (cat) {
          setIsEditingCategory(true);
          setCurrentCategoryId(cat.id);
          setNewCategory(cat.name);
      } else {
          setIsEditingCategory(false);
          setCurrentCategoryId(null);
          setNewCategory('');
      }
      setCategoryModalOpen(true);
  }

  const closeCategoryModal = () => {
      setNewCategory('');
      setIsEditingCategory(false);
      setCurrentCategoryId(null);
      setCategoryModalOpen(false);
  }

  const handleCategorySubmit = async (e) => {
      e.preventDefault();
      if(isEditingCategory) {
        const categoryDoc = doc(db, 'categories', currentCategoryId);
        await setDoc(categoryDoc, { name: newCategory });
      } else {
        await addDoc(categoriesCollectionRef, { name: newCategory });
      }
      getCategories();
      closeCategoryModal();
  }

  const handleDeleteCategory = async (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
        const categoryDoc = doc(db, 'categories', id);
        await deleteDoc(categoryDoc);
        getCategories();
    }
  }

  const openPreviewModal = (guide) => {
    setPreviewGuide(guide);
    setPreviewModalOpen(true);
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
    <Layout>
      <div className="w-full h-full p-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">User Guide</h1>
                <p className="mt-1 text-sm text-gray-600">Manage and organize guides for your mobile app users.</p>
            </div>
          <div className="flex space-x-2 mt-4 sm:mt-0">
            <button onClick={() => openGuideModal()} className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700">
              <PlusIcon />
              New Guide
            </button>
            <button onClick={() => openCategoryModal()} className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50">
              Manage Categories
            </button>
          </div>
        </header>

        {isCategoryModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50" onClick={closeCategoryModal} />
                <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
                    <div className="p-5 border-b flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Manage Categories</h3>
                        <button onClick={closeCategoryModal}><XIcon/></button>
                    </div>
                    <div className="p-6">
                        <form onSubmit={handleCategorySubmit} className="flex items-center mb-4">
                            <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder={isEditingCategory ? "Update category name" : "Create a new category"} className="w-full border rounded-md px-3 py-2 text-sm" required />
                            <button type="submit" className="ml-3 shrink-0 px-4 py-2 text-sm rounded-md text-white bg-[#111418]">{isEditingCategory ? 'Update' : 'Add'}</button>
                        </form>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {categories.map(cat => (
                                <div key={cat.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                                    <p className="text-sm font-medium text-gray-800">{cat.name}</p>
                                    <div className="flex items-center space-x-3">
                                        <button onClick={() => openCategoryModal(cat)} className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
                                        <button onClick={() => handleDeleteCategory(cat.id)} className="text-sm text-red-600 hover:red-800">Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
             </div>
        )}

        <main>
          {Object.keys(guidesByCategory).sort().map(categoryName => (
            <div key={categoryName} className="mb-10">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">{categoryName}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {guidesByCategory[categoryName].map(guide => (
                  <div key={guide.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col justify-between transform hover:-translate-y-1 transition-transform duration-300">
                    <div className="p-5">
                        {guide.image && <img src={guide.image} alt={guide.title} className="w-full h-40 object-cover rounded-md mb-4"/>}
                      <h3 className="text-lg font-bold text-gray-900 truncate">{guide.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 h-10 overflow-hidden">{guide.subtitle}</p>
                    </div>
                    <div className="px-5 pb-4 flex justify-end space-x-2 bg-gray-50 border-t pt-4">
                        <button onClick={() => openPreviewModal(guide)} className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                            <PreviewIcon/> Preview
                        </button>
                        <button onClick={() => openGuideModal(guide)} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600">
                            <EditIcon/> Edit
                        </button>
                         <button onClick={() => handleDeleteGuide(guide.id)} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
                            <DeleteIcon/> Delete
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </main>

        {isGuideModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                 <div className="absolute inset-0 bg-black/50" onClick={closeGuideModal} />
                <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
                    <form onSubmit={handleGuideSubmit} className="flex flex-col flex-grow">
                         <div className="p-6 border-b">
                            <h3 className="text-lg font-semibold">{isEditing ? 'Edit Guide' : 'Create New Guide'}</h3>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Subtitle</label>
                                <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" rows="3"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Process (Steps)</label>
                                {steps.map((step, index) => (
                                    <div key={index} className="flex items-center gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={step}
                                            onChange={(e) => handleStepChange(index, e)}
                                            className="w-full border rounded-md px-3 py-2 text-sm"
                                            placeholder={`Step ${index + 1}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeStep(index)}
                                            disabled={steps.length <= 1}
                                            className="shrink-0 px-3 py-2 text-sm rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addStep}
                                    className="mt-2 w-full px-4 py-2 text-sm rounded-md border border-dashed border-gray-400 text-gray-600 hover:bg-gray-100"
                                >
                                    Add Step
                                </button>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Image</label>
                                <input type="file" onChange={handleImageChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                                {image && !imageFile && <img src={image} alt="Current" className="mt-2 h-20 rounded-md"/>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" required>
                                    <option value="">Select a category</option>
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </div>
                        </div>
                         <div className="flex items-center justify-end gap-2 p-4 bg-gray-50 border-t">
                            <button type="button" onClick={closeGuideModal} className="px-4 py-2 text-sm rounded-md border">Cancel</button>
                            <button type="submit" disabled={isUploading} className="px-4 py-2 text-sm rounded-md text-white bg-[#111418]">{isUploading ? 'Uploading...' : (isEditing ? 'Update Guide' : 'Create Guide')}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {isPreviewModalOpen && (
             <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                <div className="relative mx-auto w-80 h-[580px] bg-white rounded-[2.5rem] border-8 border-gray-800 shadow-2xl">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-gray-800 rounded-b-lg"></div>
                    <div className="w-full h-full rounded-[2rem] overflow-hidden flex flex-col">
                         <header className="p-3 border-b flex justify-between items-center bg-gray-50 flex-shrink-0">
                            <h3 className="text-base font-bold truncate pr-4">{previewGuide?.title}</h3>
                            <button onClick={() => setPreviewModalOpen(false)} className="text-gray-500 hover:text-gray-800 shrink-0"><XIcon/></button>
                        </header>
                        <main className="p-4 overflow-y-auto flex-grow bg-white">
                            {previewGuide?.image && <img src={previewGuide.image} alt={previewGuide.title} className="w-full h-32 object-cover rounded-lg mb-4" />}
                             <p className="text-sm text-gray-500 mb-3">{previewGuide?.subtitle}</p>
                             <p className="text-sm text-gray-700 mb-4">{previewGuide?.description}</p>
                             <h4 className="font-bold text-sm mb-2">Steps:</h4>
                             {previewGuide?.process && Array.isArray(previewGuide.process) && previewGuide.process.length > 0 && (
                                 <ol className="list-decimal list-inside prose prose-sm max-w-none space-y-2">
                                     {previewGuide.process.map((step, index) => (
                                         <li key={index}>{step}</li>
                                     ))}
                                 </ol>
                             )}
                        </main>
                    </div>
                </div>
            </div>
        )}

      </div>
    </Layout>
  );
};

export default UserGuide;
