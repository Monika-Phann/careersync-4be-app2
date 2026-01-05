// src/pages/PositionManagement.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig'; 
import 'bootstrap/dist/css/bootstrap.min.css';
import '../assets/css/components/positionmanagement.css';
import Swal from 'sweetalert2'; 

// ✅ FIX: Get API URL from environment variable with proper fallback
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  
  // List of placeholder patterns to reject
  const placeholderPatterns = [
    'your-api-domain.com',
    'your-api-domain',
    'example.com',
    'localhost:3000',
  ];
  
  // Check if URL contains any placeholder patterns
  const isPlaceholder = envUrl && placeholderPatterns.some(pattern => 
    envUrl.toLowerCase().includes(pattern.toLowerCase())
  );
  
  // Use environment URL if it's valid and not a placeholder
  if (envUrl && !isPlaceholder && envUrl.startsWith('http')) {
    // Remove /api suffix if present (we need base URL for images)
    return envUrl.replace(/\/api(\/v1)?$/, '');
  }
  
  // Check if we're in production mode
  if (import.meta.env.PROD || window.location.hostname !== 'localhost') {
    if (isPlaceholder || !envUrl) {
      console.error('⚠️ VITE_API_URL contains placeholder or is missing. Using fallback API URL.');
    }
    return 'https://api.careersync-4be.ptascloud.online'; // Update with your actual API domain
  }
  
  // Development fallback
  return 'http://localhost:5001';
};

const API_URL = getApiUrl();

const PositionManagement = () => {
  const [activeTab, setActiveTab] = useState('position');
  const [industries, setIndustries] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // View Modal state
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);

  // Industry form state
  const [showIndustryForm, setShowIndustryForm] = useState(false);
  const [industryFormData, setIndustryFormData] = useState({
    id: null,
    industry_name: '',
  });

  // Position form state
  const [showPositionForm, setShowPositionForm] = useState(false);
  const [positionFormData, setPositionFormData] = useState({
    id: null,
    industry_id: '',
    position_name: '',
    description: '',
    image_position: null,
  });

  useEffect(() => {
    fetchIndustries();
    fetchPositions();
  }, []);

  // --- Fetch Data ---
  const fetchIndustries = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/industry'); 
      setIndustries(response.data);
    } catch (error) {
      console.error('Error fetching industries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/position'); 
      setPositions(response.data);
    } catch (error) {
      console.error('Error fetching positions:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- View Detail Handler ---
  const handleViewPosition = (position) => {
    setSelectedPosition(position);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedPosition(null);
  };

  // --- Industry Handlers ---
  const handleAddIndustry = () => {
    setIndustryFormData({ id: null, industry_name: '' });
    setShowIndustryForm(true);
  };

  const handleEditIndustry = (industry) => {
    setIndustryFormData({
      id: industry.id,
      industry_name: industry.industry_name
    });
    setShowIndustryForm(true);
  };

  const handleDeleteIndustry = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/admin/industry/${id}`);
        fetchIndustries();
        Swal.fire('Deleted!', 'Industry has been deleted.', 'success');
      } catch (error) {
        Swal.fire('Error', 'Failed to delete industry.', 'error');
      }
    }
  };

  const handleIndustrySubmit = async () => {
    if (!industryFormData.industry_name.trim()) {
      Swal.fire('Warning', 'Industry name is required', 'warning');
      return;
    }
    try {
      if (industryFormData.id) {
        await api.put(`/admin/industry/${industryFormData.id}`, industryFormData);
        Swal.fire('Success', 'Industry updated successfully', 'success');
      } else {
        await api.post('/admin/industry', industryFormData);
        Swal.fire('Success', 'Industry created successfully', 'success');
      }
      setShowIndustryForm(false);
      fetchIndustries();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to save industry', 'error');
    }
  };

  // --- Position Handlers ---
  const handleAddPosition = () => {
    setPositionFormData({
      id: null,
      industry_id: '',
      position_name: '',
      description: '',
      image_position: null,
    });
    setShowPositionForm(true);
  };

  const handleEditPosition = (position) => {
    setPositionFormData({
      id: position.id,
      industry_id: String(position.industry_id),
      position_name: position.position_name,
      description: position.description,
      image_position: position.image_position,
    });
    setShowPositionForm(true);
    setActiveTab('create-position');
  };

  const handleDeletePosition = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Position?',
      text: "This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/admin/position/${id}`);
        fetchPositions();
        Swal.fire('Deleted!', 'Position has been deleted.', 'success');
      } catch (error) {
        Swal.fire('Error', 'Failed to delete position', 'error');
      }
    }
  };

  const handlePositionSubmit = async () => {
    if (!positionFormData.position_name.trim() || !positionFormData.industry_id) {
      Swal.fire('Missing Info', 'Position title and industry are required.', 'warning');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('industry_id', positionFormData.industry_id);
      formData.append('position_name', positionFormData.position_name);
      formData.append('description', positionFormData.description || '');
      
      if (positionFormData.image_position instanceof File) {
        formData.append('image_position', positionFormData.image_position);
      }

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (positionFormData.id) {
        await api.put(`/admin/position/${positionFormData.id}`, formData, config);
        Swal.fire('Updated!', 'Position updated successfully', 'success');
      } else {
        await api.post('/admin/position', formData, config);
        Swal.fire('Created!', 'Position created successfully', 'success');
      }

      setShowPositionForm(false);
      fetchPositions();
      setPositionFormData({
        id: null,
        industry_id: '',
        position_name: '',
        description: '',
        image_position: null,
      });
      setActiveTab('position');
    } catch (error) {
      console.error('Error saving position:', error);
      Swal.fire('Error', 'Failed to save position.', 'error');
    }
  };

  const renderImagePreview = () => {
    if (!positionFormData.image_position) return null;
    let src = '';
    if (positionFormData.image_position instanceof File) {
      src = URL.createObjectURL(positionFormData.image_position);
    } else {
      // Handle both R2 URLs (full URLs) and legacy local paths
      src = positionFormData.image_position.startsWith('http') 
        ? positionFormData.image_position 
        : `${API_URL}/uploads/positions/${positionFormData.image_position}`;
    }
    return (
      <div className="mt-2">
        <img src={src} alt="Preview" className="img-thumbnail" style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
      </div>
    );
  };

  // --- Pagination Logic ---
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentPositions = positions.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(positions.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="position-management-container">
      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'position' ? 'active' : ''}`} onClick={() => setActiveTab('position')}>
            View Positions
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'industry' ? 'active' : ''}`} onClick={() => { setActiveTab('industry'); setShowIndustryForm(false); }}>
            Manage Industries
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'create-position' ? 'active' : ''}`} onClick={() => { setActiveTab('create-position'); handleAddPosition(); }}>
            Create/Update Position
          </button>
        </li>
      </ul>

      {/* --- Tab 1: View Positions --- */}
      {activeTab === 'position' && (
        <div className="card p-4 mb-4 shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3>All Positions</h3>
            <span className="badge bg-primary">Total: {positions.length}</span>
          </div>
          
          {loading && positions.length === 0 ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>No.</th>
                      <th>Image</th>
                      <th>Title</th>
                      <th>Industry</th>
                      <th style={{width: '200px'}}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPositions.map((p, index) => (
                      <tr key={p.id}>
                        <td>{indexOfFirst + index + 1}</td>
                        <td>
                          {p.image_position ? (
                            <img 
                              src={p.image_position.startsWith('http') 
                                ? p.image_position 
                                : `${API_URL}/uploads/positions/${p.image_position}`} 
                              alt={p.position_name}
                              style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #dee2e6' }}
                              onError={(e) => {e.target.style.display='none'}}
                            />
                          ) : <span className="text-muted small">No Img</span>}
                        </td>
                        <td className="fw-bold text-dark">{p.position_name}</td>
                        <td><span className="badge bg-light text-dark border">{p.industry}</span></td>
                        <td>
                          {/* ✅ View Button Added */}
                          <button className="btn btn-sm btn-info text-white me-2" onClick={() => handleViewPosition(p)} title="View Detail">
                             👁️ 
                          </button>
                          <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEditPosition(p)} title="Edit">
                             ✏️ 
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeletePosition(p.id)} title="Delete">
                             🗑️ 
                          </button>
                        </td>
                      </tr>
                    ))}
                    {positions.length === 0 && (
                      <tr><td colSpan="5" className="text-center p-4">No positions found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ✅ Pagination Controls */}
              {totalPages > 1 && (
                <nav className="d-flex justify-content-center mt-4">
                  <ul className="pagination">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => paginate(currentPage - 1)}>Previous</button>
                    </li>
                    {[...Array(totalPages)].map((_, i) => (
                      <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => paginate(i + 1)}>{i + 1}</button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => paginate(currentPage + 1)}>Next</button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      )}

      {/* --- Tab 2: Manage Industries --- */}
      {activeTab === 'industry' && (
        <div className="card p-4 mb-4 shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3>Industry Management</h3>
            <button className="btn btn-success" onClick={handleAddIndustry}>+ Add Industry</button>
          </div>

          {showIndustryForm && (
            <div className="card p-3 mb-4 bg-light border-0">
              <h5 className="mb-3">{industryFormData.id ? 'Edit Industry' : 'Add New Industry'}</h5>
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter industry name..."
                  value={industryFormData.industry_name}
                  onChange={(e) => setIndustryFormData({ ...industryFormData, industry_name: e.target.value })}
                />
                <button className="btn btn-primary" onClick={handleIndustrySubmit}>Save</button>
                <button className="btn btn-outline-secondary" onClick={() => setShowIndustryForm(false)}>Cancel</button>
              </div>
            </div>
          )}
          
          <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Name</th>
                    <th style={{width: '150px'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {industries.map((ind, index) => (
                    <tr key={ind.id}>
                      <td>{index + 1}</td>
                      <td>{ind.industry_name}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEditIndustry(ind)}>✏️</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteIndustry(ind.id)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        </div>
      )}

      {/* --- Tab 3: Create/Update Position --- */}
      {activeTab === 'create-position' && (
        <div className="card p-4 mb-4 shadow-sm">
          <h3 className="mb-4">{positionFormData.id ? 'Edit Position' : 'Add New Position'}</h3>
          <div className="row g-3">
            <div className="col-md-6">
                <label className="form-label fw-bold">Industry <span className="text-danger">*</span></label>
                <select className="form-select" value={positionFormData.industry_id} onChange={(e) => setPositionFormData({ ...positionFormData, industry_id: e.target.value })}>
                <option value="">Select Industry</option>
                {industries.map((ind) => (
                    <option key={ind.id} value={ind.id}>{ind.industry_name}</option>
                ))}
                </select>
            </div>
            <div className="col-md-6">
                <label className="form-label fw-bold">Position Title <span className="text-danger">*</span></label>
                <input type="text" className="form-control" placeholder="e.g. Senior Developer" value={positionFormData.position_name} onChange={(e) => setPositionFormData({ ...positionFormData, position_name: e.target.value })}/>
            </div>
            <div className="col-12">
                <label className="form-label fw-bold">Description</label>
                <textarea className="form-control" rows="4" placeholder="Description..." value={positionFormData.description} onChange={(e) => setPositionFormData({ ...positionFormData, description: e.target.value })}/>
            </div>
            <div className="col-12">
                <label className="form-label fw-bold">Image (Optional)</label>
                <input type="file" className="form-control" accept="image/*" onChange={(e) => setPositionFormData({ ...positionFormData, image_position: e.target.files[0] })}/>
                {renderImagePreview()}
            </div>
            <div className="col-12 mt-4">
                <button className="btn btn-primary px-4 me-2" onClick={handlePositionSubmit}>{positionFormData.id ? 'Update Position' : 'Create Position'}</button>
                <button className="btn btn-secondary px-4" onClick={() => { setActiveTab('position'); handleAddPosition(); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ View Detail Modal (Popup) */}
      {showViewModal && selectedPosition && (
        <>
            {/* Modal Backdrop (Click to close) */}
            <div className="modal-backdrop fade show" onClick={closeViewModal}></div>
            
            <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                <div className="modal-header">
                    <h5 className="modal-title">Position Details</h5>
                    <button type="button" className="btn-close" onClick={closeViewModal}></button>
                </div>
                <div className="modal-body">
                    <div className="text-center mb-4">
                    {selectedPosition.image_position ? (
                        <img 
                        src={selectedPosition.image_position.startsWith('http') 
                          ? selectedPosition.image_position 
                          : `${API_URL}/uploads/positions/${selectedPosition.image_position}`} 
                        alt={selectedPosition.position_name}
                        className="img-fluid rounded shadow-sm"
                        style={{ maxHeight: '200px', objectFit: 'contain' }}
                        />
                    ) : (
                        <div className="bg-light p-4 rounded text-muted">No Image Available</div>
                    )}
                    </div>
                    
                    <div className="mb-3">
                        <label className="fw-bold text-muted small text-uppercase">Title</label>
                        <p className="fs-5 text-dark mb-0">{selectedPosition.position_name}</p>
                    </div>
                    <div className="mb-3">
                        <label className="fw-bold text-muted small text-uppercase">Industry</label>
                        <p className="fs-5 text-dark mb-0"><span className="badge bg-info text-dark">{selectedPosition.industry}</span></p>
                    </div>
                    <div className="mb-3">
                        <label className="fw-bold text-muted small text-uppercase">Description</label>
                        <p className="text-secondary bg-light p-3 rounded">{selectedPosition.description || "No description provided."}</p>
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={closeViewModal}>Close</button>
                    <button type="button" className="btn btn-primary" onClick={() => { closeViewModal(); handleEditPosition(selectedPosition); }}>Edit</button>
                </div>
                </div>
            </div>
            </div>
        </>
      )}

    </div>
  );
};

export default PositionManagement;