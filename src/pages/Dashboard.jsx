import React, { useState, useEffect } from 'react';
import axios from 'axios';

const token = localStorage.getItem('token');
const authHeader = { headers: { Authorization: `Bearer ${token}` } };

export default function Dashboard() {
  const [folders, setFolders] = useState([]);
  const [images, setImages] = useState([]);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageName, setImageName] = useState('');
  const [search, setSearch] = useState('');

  const fetchFolders = async () => {
    const res = await axios.get(`http://localhost:5000/api/folders?parentId=${parentId || ''}`, authHeader);
    setFolders(res.data);
  };

  const handleCreateFolder = async () => {
    await axios.post('http://localhost:5000/api/folders', { name, parentId }, authHeader);
    fetchFolders();
  };

  const handleUploadImage = async () => {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('name', imageName);
    formData.append('folderId', parentId);
    await axios.post('http://localhost:5000/api/images/upload', formData, {
      ...authHeader,
      headers: { ...authHeader.headers, 'Content-Type': 'multipart/form-data' },
    });
    fetchFolders();
  };

  const handleSearch = async () => {
    const res = await axios.get(`http://localhost:5000/api/images/search?query=${search}`, authHeader);
    setImages(res.data);
  };

  useEffect(() => { fetchFolders(); }, [parentId]);

  return (
    <div>
      <h2>Dashboard</h2>
      <input placeholder="New Folder Name" onChange={e => setName(e.target.value)} />
      <button onClick={handleCreateFolder}>Create Folder</button>

      <input placeholder="Image Name" onChange={e => setImageName(e.target.value)} />
      <input type="file" onChange={e => setImageFile(e.target.files[0])} />
      <button onClick={handleUploadImage}>Upload Image</button>

      <input placeholder="Search Images" onChange={e => setSearch(e.target.value)} />
      <button onClick={handleSearch}>Search</button>

      <h3>Folders</h3>
      {folders.map(folder => (
        <div key={folder._id} onClick={() => setParentId(folder._id)} style={{ cursor: 'pointer' }}>{folder.name}</div>
      ))}

      <h3>Search Results</h3>
      {images.map(img => (
        <div key={img._id}>
          <p>{img.name}</p>
          <img src={`http://localhost:5000${img.url}`} alt={img.name} width={100} />
        </div>
      ))}
    </div>
  );
}
