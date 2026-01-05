import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import Swal from "sweetalert2";
import '../assets/css/components/createuser.css';

// 🔥 1. Restore Imports for Excel & PDF
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; 

// 🔥 2. FIXED PATHS (សម្រាប់រូបក្នុង folder public)
// ដោយសារបងដាក់រូបក្នុង folder "public" បងគ្រាន់តែហៅឈ្មោះ file ផ្ទាល់គឺបានហើយ
const smartLogo = "/smart.png";
const cellcardLogo = "/cellcard.png";
const metfoneLogo = "/metfone.png";

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user')) || {};
  // Get API URL with proper fallback
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
  
  const API_IMG_URL = getApiUrl();

  // --- HELPER: ROLE & STATUS ---
  const getRoleBadge = (role) => <span className={`user-role-badge ${role?.toLowerCase() || 'user'}`}>{role || 'User'}</span>;
  const getStatusBadge = (status) => <span className={`user-status-badge ${status?.toLowerCase() || 'unknown'}`}>{status || 'Unknown'}</span>;

  // 🔥 3. PHONE BADGE (Updated Logic)
  const getPhoneBadge = (phone) => {
    // Check null, undefined, or 'N/A'
    if (!phone || phone === 'N/A' || phone === '-') {
        return <span style={{color: '#cbd5e0', fontSize: '0.85rem', fontStyle: 'italic'}}>No Phone</span>;
    }
    
    // Clean Phone
    const cleanPhone = phone.replace('+855', '0').replace(/\s/g, '');
    const prefix = cleanPhone.substring(0, 3);
    
    let logo = null;
    let carrierClass = 'unknown';

    // Carrier Logic
    const smartPrefixes = ['010','015','016','069','070','081','086','087','093','096','098'];
    const cellcardPrefixes = ['011','012','014','017','061','076','077','078','085','089','092','095','099'];
    const metfonePrefixes = ['031','060','066','067','068','071','088','090','097'];

    if (smartPrefixes.includes(prefix)) { 
      logo = smartLogo; carrierClass = 'smart'; 
    } else if (cellcardPrefixes.includes(prefix)) { 
      logo = cellcardLogo; carrierClass = 'cellcard'; 
    } else if (metfonePrefixes.includes(prefix)) { 
      logo = metfoneLogo; carrierClass = 'metfone'; 
    }

    return (
      <div className={`carrier-badge ${carrierClass}`}>
        {logo ? (
          <img src={logo} alt="Carrier" className="carrier-logo" />
        ) : (
          <span className="carrier-text-icon">📞</span>
        )}
        <span className="phone-text">{cleanPhone}</span>
      </div>
    );
  };

  // 1. Fetch Users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/users`);
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error) { console.error('Error fetching users:', error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  // 2. Search Logic
  useEffect(() => {
    let result = users;
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(u => u.name?.toLowerCase().includes(lower) || u.email?.toLowerCase().includes(lower));
    }
    setFilteredUsers(result);
    setCurrentPage(1);
  }, [search, users]);

  // 🔥 4. EXPORT TO EXCEL
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredUsers.map(u => ({
        'Email': u.email, 'Name': u.name, 'Role': u.role_name, 
        'Phone': u.admin?.phone || u.mentor?.phone || u.accUser?.phone || 'N/A',
        'Status': u.status, 'Created By': u.created_by, 'Joined Date': new Date(u.created_at).toLocaleDateString()
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, "User_Report.xlsx");
  };

  // 🔥 5. EXPORT TO PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("User Report", 14, 20);
    autoTable(doc, {
      head: [["#", "Email", "Name", "Role", "Phone", "Created By", "Status"]],
      body: filteredUsers.map((u, i) => [
        i + 1, u.email, u.name, u.role_name, 
        u.admin?.phone || u.mentor?.phone || u.accUser?.phone || '-', 
        u.created_by, u.status
      ]),
      startY: 30,
    });
    doc.save("User_Report.pdf");
  };



  // 3. DELETE (MODERN & PROFESSIONAL STYLE) ✨
  const handleDelete = (userId) => {
    Swal.fire({
      title: "Delete User?",
      text: "Are you sure you want to remove this user? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      
      // ✅ STYLE ថ្មី: ប្រើពណ៌ដែលស៊ីគ្នា
      confirmButtonColor: "#EF4444", // ពណ៌ក្រហមសម្រាប់លុប
      cancelButtonColor: "#94a3b8", // ពណ៌ប្រផេះសម្រាប់ Cancel
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      
      // ✅ ICON STYLE
      iconColor: "#EF4444",
      background: "#fff",
      backdrop: `rgba(0,0,0,0.4)`, // ធ្វើឱ្យ Background ខ្មៅស្រាលៗ
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/admin/user/${userId}`);
          
          // ✅ SUCCESS ALERT
          Swal.fire({
            icon: "success",
            title: "Deleted Successfully",
            text: "The user account has been removed.",
            confirmButtonColor: "#10B981", // បៃតង
            confirmButtonText: "Okay",
            timer: 2000, // បិទអូតូក្នុង 2 វិនាទី
            timerProgressBar: true
          });
          
          fetchUsers();
        } catch (error) {
          // 🔥 NEW: PROFESSIONAL ERROR ALERT (ជំនួសអា Error ធំៗ)
          Swal.fire({
            icon: "error", // ឬប្រើ 'info' បើមិនចង់ឱ្យមើលទៅធ្ងន់ធ្ងរពេក
            title: "Action Denied",
            // ប្រើ HTML ដើម្បីតម្រូវពណ៌អក្សរ
            html: `<div style="color: #64748b; font-size: 0.95rem;">
                    ${error.response?.data?.message || "You do not have permission to delete this user."}
                   </div>`,
            confirmButtonText: "Understood",
            confirmButtonColor: "#4F46E5", // ពណ៌ Indigo
            footer: '<span style="color: #94a3b8; font-size: 0.8rem;">Security Protocol: Admin Protection</span>'
          });
        }
      }
    });
  };

  // View Logic
  const handleView = async (id) => {
    setShowModal(true); setModalLoading(true);
    try { const response = await api.get(`/admin/user/${id}`); setSelectedUser(response.data); } 
    catch (error) { setShowModal(false); } finally { setModalLoading(false); }
  };

  // Pagination & Render
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const handleRowsChange = (e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); };

  const renderProfileImage = (user) => {
    const imgName = user.admin?.profile_image || user.mentor?.profile_image || user.accUser?.profile_image;
    const imgUrl = imgName ? `${API_IMG_URL}/uploads/profiles/${imgName}` : null;
    return imgUrl ? <img src={imgUrl} alt="Profile" className="modal-profile-img" onError={(e) => e.target.style.display='none'} /> : <div className="modal-profile-placeholder">👤</div>;
  };

  const getFullName = (u) => {
    if(u.admin) return `${u.admin.first_name} ${u.admin.last_name}`;
    if(u.mentor) return `${u.mentor.first_name} ${u.mentor.last_name}`;
    if(u.accUser) return `${u.accUser.first_name} ${u.accUser.last_name}`;
    return 'Unknown User';
  };

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <div><h2>User Management</h2><p>Manage all users</p></div>
        <button className="user-create-button" onClick={() => navigate('/create-user')}><span>+</span> Create New User</button>
      </div>

      <div className="user-table-container" style={{ marginBottom: '20px', padding: '1.5rem' }}>
        <div className="filter-row" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
             <label style={{display:'block', marginBottom:'5px', fontSize:'0.85rem', fontWeight:'600', color:'#4a5568'}}>Search Users</label>
             <input type="text" className="form-control" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
          </div>
          <div style={{marginLeft:'auto', display:'flex', gap:'10px'}}>
             <button onClick={exportToExcel} className="user-create-button" style={{background:'#10B981', boxShadow:'none', minWidth:'100px', justifyContent:'center'}}>Excel</button>
             <button onClick={exportToPDF} className="user-create-button" style={{background:'#EF4444', boxShadow:'none', minWidth:'100px', justifyContent:'center'}}>PDF</button>
          </div>
        </div>
      </div>

      <div className="user-table-container">
        <table className="user-table">
          <thead>
            <tr><th>#</th><th>Email</th><th>Name</th><th>Role</th><th>Phone</th><th>Created By</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="8" style={{textAlign:'center', padding:'3rem'}}>Loading...</td></tr> :
             currentItems.map((user, index) => (
                <tr key={user.id}>
                  <td>{indexOfFirstItem + index + 1}</td>
                  <td>{user.email}</td>
                  <td>{user.name}</td>
                  <td>{getRoleBadge(user.role_name)}</td>
                  
                  {/* 🔥 Phone Badge Display */}
                  <td>{getPhoneBadge(user.admin?.phone || user.mentor?.phone || user.accUser?.phone)}</td>
                  
                  <td><span style={{color: '#64748b', fontSize:'0.9rem'}}>{user.created_by}</span></td>
                  <td>{getStatusBadge(user.status)}</td>
                  <td>
                    <div className="user-table-actions">
                      <button onClick={() => handleView(user.id)} className="user-action-btn" title="View">👁️</button>
                      {user.id !== currentUser.id && <button onClick={() => handleDelete(user.id)} className="user-action-btn" title="Delete">🗑️</button>}
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
        
        {/* Pagination Controls */}
        <div className="user-pagination-footer">
            <div className="rows-per-page"><span style={{ marginRight: '10px' }}>Rows:</span><select value={itemsPerPage} onChange={handleRowsChange}><option value={20}>20</option><option value={40}>40</option></select></div>
            <div className="user-pagination"><button className="user-page-btn" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>&lt;</button><span style={{margin:'0 10px'}}>Page {currentPage} of {totalPages}</span><button className="user-page-btn" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>&gt;</button></div>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>User Profile</h3><button onClick={() => setShowModal(false)} className="close-btn">&times;</button></div>
            <div className="modal-body">
                <div className="modal-top-section">
                     {renderProfileImage(selectedUser)}
                     <h2 className="modal-user-name">{getFullName(selectedUser)}</h2>
                     <p className="modal-user-email">{selectedUser.email}</p>
                     <div className="modal-badges">{getRoleBadge(selectedUser.role_name)}{getStatusBadge(selectedUser.status)}</div>
                </div>
                <hr style={{margin: '20px 0', borderColor:'#f1f5f9'}}/>
                <div className="modal-grid">
                  <div className="grid-item">
                      <label>Contact Number</label> 
                      <div style={{marginTop:'5px'}}>
                        {getPhoneBadge(selectedUser.admin?.phone || selectedUser.mentor?.phone || selectedUser.accUser?.phone)}
                      </div>
                  </div>
                  <div className="grid-item"><label>Joined Date</label> <span>{new Date(selectedUser.created_at).toLocaleDateString()}</span></div>
                  <div className="grid-item"><label>Gender</label> <span style={{textTransform:'capitalize'}}>{selectedUser.mentor?.gender || selectedUser.accUser?.gender || 'N/A'}</span></div>
                  {selectedUser.role_name === 'user' && selectedUser.accUser && (<><div className="grid-item"><label>Type</label> <span>{selectedUser.accUser.types_user}</span></div><div className="grid-item full-width"><label>Institution</label> <span>{selectedUser.accUser.institution_name}</span></div></>)}
                  {selectedUser.role_name === 'mentor' && selectedUser.mentor && (<><div className="grid-item"><label>Job Title</label> <span>{selectedUser.mentor.job_title}</span></div><div className="grid-item"><label>Company</label> <span>{selectedUser.mentor.company_name}</span></div></>)}
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;