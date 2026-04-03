import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { datLoadBoardApi } from '../config/employeeApi';
import DATAttribution from '../components/DATAttribution';
import {
  ArrowLeft, Search, RefreshCw, Trash2, Truck, Package,
  MapPin, DollarSign, Calendar, Loader, AlertTriangle, CheckCircle,
  Send
} from 'lucide-react';
import './DATLoadBoard.css';

const TABS = [
  { id: 'search', label: 'Search DAT', icon: Search },
  { id: 'post', label: 'Post to DAT', icon: Send },
  { id: 'my-posts', label: 'My DAT Posts', icon: Package },
];

const EQUIPMENT_COMMON = [
  { code: 'V', name: 'Van' },
  { code: 'R', name: 'Reefer' },
  { code: 'F', name: 'Flatbed' },
  { code: 'VR', name: 'Van or Reefer' },
  { code: 'SD', name: 'Step Deck' },
  { code: 'FT', name: 'Flatbed w/Tarps' },
  { code: 'DD', name: 'Double Drop' },
  { code: 'LB', name: 'Lowboy' },
  { code: 'RG', name: 'Removable Gooseneck' },
  { code: 'AC', name: 'Auto Carrier' },
  { code: 'C', name: 'Container' },
  { code: 'PO', name: 'Power Only' },
  { code: 'HB', name: 'Hopper Bottom' },
  { code: 'TA', name: 'Tanker, Aluminum' },
  { code: 'SV', name: 'Sprinter Van' },
  { code: 'SB', name: 'Straight Box Truck' },
];

const DATLoadBoard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('search');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Search state
  const [searchType, setSearchType] = useState('loads');
  const [searchCriteria, setSearchCriteria] = useState({
    originZip: '', destinationZip: '', equipmentType: '', originRadius: 100, destinationRadius: 100,
  });
  const [searchResults, setSearchResults] = useState(null);

  // Post state
  const [postType, setPostType] = useState('load');
  const [postForm, setPostForm] = useState({
    originZip: '', destinationZip: '', equipmentType: 'V', fullPartial: 'FULL',
    pickupDate: '', deliveryDate: '', weight: '', length: '', rate: '', commodity: '', comment: '',
    pallets: '', pieceCount: '', dims: '',
    currentLocation: '', preferredDestination: '', availableDate: '', capacity: '',
  });

  // My posts state
  const [myPosts, setMyPosts] = useState([]);
  const [myPostsStats, setMyPostsStats] = useState(null);
  const [postsFilter, setPostsFilter] = useState('active');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (activeTab === 'my-posts') fetchMyPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, postsFilter]);

  const fetchMyPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await datLoadBoardApi.getMyPosts({ status: postsFilter || undefined });
      setMyPosts(res.data?.posts || []);
      setMyPostsStats(res.data?.stats || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [postsFilter]);

  const clearMessages = () => { setError(null); setSuccess(null); };

  // ─── Search ────────────────────────────────────────────────

  const handleSearch = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!searchCriteria.originZip && !searchCriteria.destinationZip) {
      setError('Please enter at least an origin or destination zip code');
      return;
    }
    setLoading(true);
    try {
      const fn = searchType === 'loads' ? datLoadBoardApi.searchLoads : datLoadBoardApi.searchTrucks;
      const res = await fn(searchCriteria);
      setSearchResults(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Post ──────────────────────────────────────────────────

  const handlePost = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      if (postType === 'load') {
        const loadPayload = {
          originZip: postForm.originZip,
          destinationZip: postForm.destinationZip,
          equipmentType: postForm.equipmentType,
          fullPartial: postForm.fullPartial,
          pickupDate: postForm.pickupDate,
          deliveryDate: postForm.deliveryDate,
          weight: postForm.weight,
          length: postForm.length,
          rate: postForm.rate,
          commodity: postForm.commodity,
          comment: postForm.comment,
        };
        if (postForm.fullPartial === 'PARTIAL') {
          const parts = [];
          if (postForm.pallets) parts.push(`${postForm.pallets} pallets`);
          if (postForm.pieceCount) parts.push(`${postForm.pieceCount} pieces`);
          if (postForm.dims) parts.push(postForm.dims);
          if (parts.length > 0) {
            loadPayload.comment = [parts.join(', '), postForm.comment].filter(Boolean).join(' | ');
          }
        }
        await datLoadBoardApi.createLoadPost(loadPayload);
      } else {
        await datLoadBoardApi.createTruckPost({
          originZip: postForm.originZip || undefined,
          currentLocation: postForm.currentLocation,
          preferredDestination: postForm.preferredDestination,
          destinationZip: postForm.destinationZip || undefined,
          equipmentType: postForm.equipmentType,
          availableDate: postForm.availableDate,
          capacity: postForm.capacity,
          length: postForm.length,
          comment: postForm.comment,
        });
      }
      setSuccess(`${postType === 'load' ? 'Load' : 'Truck'} posted to DAT successfully!`);
      setPostForm({
        originZip: '', destinationZip: '', equipmentType: 'V', fullPartial: 'FULL',
        pickupDate: '', deliveryDate: '', weight: '', length: '', rate: '', commodity: '', comment: '',
        pallets: '', pieceCount: '', dims: '',
        currentLocation: '', preferredDestination: '', availableDate: '', capacity: '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Post Actions ──────────────────────────────────────────

  const handleRefresh = async (post) => {
    setActionLoading(post.datPostId);
    clearMessages();
    try {
      const fn = post.postType === 'load' ? datLoadBoardApi.refreshLoadPost : datLoadBoardApi.refreshTruckPost;
      await fn(post.datPostId);
      setSuccess(`Post ${post.datPostId} refreshed`);
      fetchMyPosts();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (post) => {
    if (!window.confirm(`Delete this ${post.postType} post from DAT?`)) return;
    setActionLoading(post.datPostId);
    clearMessages();
    try {
      const fn = post.postType === 'load' ? datLoadBoardApi.deleteLoadPost : datLoadBoardApi.deleteTruckPost;
      await fn(post.datPostId);
      setSuccess(`Post ${post.datPostId} deleted`);
      fetchMyPosts();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="dat-loadboard-container">
      {/* Sidebar */}
      <div className="dat-sidebar">
        <div className="dat-sidebar-header">
          <button className="dat-back-btn" onClick={() => navigate('/employee/broker-orders')}>
            <ArrowLeft size={16} /> Back
          </button>
          <h2>DAT Load Board</h2>
          <DATAttribution variant="badge" />
        </div>

        <nav className="dat-sidebar-nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`dat-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.id); clearMessages(); }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </nav>

        {myPostsStats && activeTab === 'my-posts' && (
          <div className="dat-stats">
            <h4>Post Stats</h4>
            <div className="dat-stat-row"><span>Active</span><strong>{myPostsStats.active}</strong></div>
            <div className="dat-stat-row"><span>Matched</span><strong>{myPostsStats.matched}</strong></div>
            <div className="dat-stat-row"><span>Deleted</span><strong>{myPostsStats.deleted}</strong></div>
            <div className="dat-stat-row total"><span>Total</span><strong>{myPostsStats.total}</strong></div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="dat-main">
        {error && <div className="dat-alert dat-alert-error"><AlertTriangle size={16} /> {error}</div>}
        {success && <div className="dat-alert dat-alert-success"><CheckCircle size={16} /> {success}</div>}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="dat-section">
            <div className="dat-section-header">
              <h3><Search size={20} /> Search DAT Load Board</h3>
              <div className="dat-toggle">
                <button className={searchType === 'loads' ? 'active' : ''} onClick={() => setSearchType('loads')}>
                  <Package size={14} /> Loads
                </button>
                <button className={searchType === 'trucks' ? 'active' : ''} onClick={() => setSearchType('trucks')}>
                  <Truck size={14} /> Trucks
                </button>
              </div>
            </div>

            <form className="dat-form" onSubmit={handleSearch}>
              <div className="dat-form-row">
                <div className="dat-field">
                  <label><MapPin size={14} /> Origin Zip</label>
                  <input type="text" placeholder="e.g. 90001" maxLength={5}
                    value={searchCriteria.originZip}
                    onChange={e => setSearchCriteria(s => ({ ...s, originZip: e.target.value }))} />
                </div>
                <div className="dat-field">
                  <label>Radius (mi)</label>
                  <input type="number" value={searchCriteria.originRadius}
                    onChange={e => setSearchCriteria(s => ({ ...s, originRadius: e.target.value }))} />
                </div>
                <div className="dat-field">
                  <label><MapPin size={14} /> Destination Zip</label>
                  <input type="text" placeholder="e.g. 33101" maxLength={5}
                    value={searchCriteria.destinationZip}
                    onChange={e => setSearchCriteria(s => ({ ...s, destinationZip: e.target.value }))} />
                </div>
                <div className="dat-field">
                  <label>Radius (mi)</label>
                  <input type="number" value={searchCriteria.destinationRadius}
                    onChange={e => setSearchCriteria(s => ({ ...s, destinationRadius: e.target.value }))} />
                </div>
              </div>
              <div className="dat-form-row">
                <div className="dat-field">
                  <label><Truck size={14} /> Equipment Type</label>
                  <select value={searchCriteria.equipmentType}
                    onChange={e => setSearchCriteria(s => ({ ...s, equipmentType: e.target.value }))}>
                    <option value="">All Types</option>
                    {EQUIPMENT_COMMON.map(eq => (
                      <option key={eq.code} value={eq.code}>{eq.code} - {eq.name}</option>
                    ))}
                  </select>
                </div>
                <div className="dat-field dat-field-action">
                  <button type="submit" className="dat-btn dat-btn-primary" disabled={loading}>
                    {loading ? <Loader size={16} className="spin" /> : <Search size={16} />}
                    Search {searchType === 'loads' ? 'Loads' : 'Trucks'}
                  </button>
                </div>
              </div>
            </form>

            {searchResults && (
              <div className="dat-results">
                <DATAttribution variant="banner" />
                <div className="dat-results-header">
                  <span>{searchResults.total || 0} results found</span>
                </div>
                {searchResults.results?.length > 0 ? (
                  <div className="dat-results-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Origin</th>
                          <th>Destination</th>
                          <th>Equipment</th>
                          <th>Rate</th>
                          <th>Weight</th>
                          <th>Date</th>
                          <th>Company</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchResults.results.map((item, i) => (
                          <tr key={item.datId || i}>
                            <td>{item.origin?.city || item.origin?.postalCode || '-'}</td>
                            <td>{item.destination?.city || item.destination?.postalCode || '-'}</td>
                            <td><span className="dat-equip-badge">{item.equipmentType || '-'}</span></td>
                            <td>{item.rate ? `$${item.rate}` : '-'}</td>
                            <td>{item.weight ? `${item.weight} lbs` : '-'}</td>
                            <td>{item.pickupDate || '-'}</td>
                            <td>{item.company || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="dat-empty">No results found. Try broadening your search.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Post Tab */}
        {activeTab === 'post' && (
          <div className="dat-section">
            <div className="dat-section-header">
              <h3><Send size={20} /> Post to DAT Load Board</h3>
              <div className="dat-toggle">
                <button className={postType === 'load' ? 'active' : ''} onClick={() => setPostType('load')}>
                  <Package size={14} /> Post Load
                </button>
                <button className={postType === 'truck' ? 'active' : ''} onClick={() => setPostType('truck')}>
                  <Truck size={14} /> Post Truck
                </button>
              </div>
            </div>

            <form className="dat-form" onSubmit={handlePost}>
              {postType === 'load' ? (
                <>
                  <div className="dat-form-row">
                    <div className="dat-field">
                      <label><MapPin size={14} /> Origin Zip *</label>
                      <input type="text" required placeholder="e.g. 90001" maxLength={5}
                        value={postForm.originZip}
                        onChange={e => setPostForm(f => ({ ...f, originZip: e.target.value }))} />
                    </div>
                    <div className="dat-field">
                      <label><MapPin size={14} /> Destination Zip *</label>
                      <input type="text" required placeholder="e.g. 33101" maxLength={5}
                        value={postForm.destinationZip}
                        onChange={e => setPostForm(f => ({ ...f, destinationZip: e.target.value }))} />
                    </div>
                    <div className="dat-field">
                      <label><Truck size={14} /> Equipment Type</label>
                      <select value={postForm.equipmentType}
                        onChange={e => setPostForm(f => ({ ...f, equipmentType: e.target.value }))}>
                        {EQUIPMENT_COMMON.map(eq => (
                          <option key={eq.code} value={eq.code}>{eq.code} - {eq.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="dat-field">
                      <label>Full / Partial *</label>
                      <select value={postForm.fullPartial}
                        onChange={e => setPostForm(f => ({ ...f, fullPartial: e.target.value }))}>
                        <option value="FULL">Full Truckload (FTL)</option>
                        <option value="PARTIAL">Partial</option>
                      </select>
                    </div>
                  </div>
                  <div className="dat-form-row">
                    <div className="dat-field">
                      <label><Calendar size={14} /> Pickup Date</label>
                      <input type="date" value={postForm.pickupDate}
                        onChange={e => setPostForm(f => ({ ...f, pickupDate: e.target.value }))} />
                    </div>
                    <div className="dat-field">
                      <label><Calendar size={14} /> Delivery Date</label>
                      <input type="date" value={postForm.deliveryDate}
                        onChange={e => setPostForm(f => ({ ...f, deliveryDate: e.target.value }))} />
                    </div>
                    <div className="dat-field">
                      <label>Weight (lbs)</label>
                      <input type="number" placeholder="e.g. 40000"
                        value={postForm.weight}
                        onChange={e => setPostForm(f => ({ ...f, weight: e.target.value }))} />
                    </div>
                    <div className="dat-field">
                      <label>Length (ft)</label>
                      <input type="number" placeholder="e.g. 53"
                        value={postForm.length}
                        onChange={e => setPostForm(f => ({ ...f, length: e.target.value }))} />
                    </div>
                  </div>
                  <div className="dat-form-row">
                    <div className="dat-field">
                      <label><DollarSign size={14} /> Rate ($)</label>
                      <input type="number" placeholder="e.g. 2500"
                        value={postForm.rate}
                        onChange={e => setPostForm(f => ({ ...f, rate: e.target.value }))} />
                    </div>
                    <div className="dat-field">
                      <label>Commodity</label>
                      <input type="text" placeholder="e.g. General Freight"
                        value={postForm.commodity}
                        onChange={e => setPostForm(f => ({ ...f, commodity: e.target.value }))} />
                    </div>
                    <div className="dat-field">
                      <label>Comment</label>
                      <input type="text" placeholder="Additional notes"
                        value={postForm.comment}
                        onChange={e => setPostForm(f => ({ ...f, comment: e.target.value }))} />
                    </div>
                  </div>
                  {postForm.fullPartial === 'PARTIAL' && (
                    <div className="dat-form-row dat-partial-row">
                      <div className="dat-partial-label">Partial / LTL Details</div>
                      <div className="dat-field">
                        <label>Pallets</label>
                        <input type="number" placeholder="e.g. 6"
                          value={postForm.pallets}
                          onChange={e => setPostForm(f => ({ ...f, pallets: e.target.value }))} />
                      </div>
                      <div className="dat-field">
                        <label>Piece Count</label>
                        <input type="number" placeholder="e.g. 12"
                          value={postForm.pieceCount}
                          onChange={e => setPostForm(f => ({ ...f, pieceCount: e.target.value }))} />
                      </div>
                      <div className="dat-field">
                        <label>Dimensions (L x W x H)</label>
                        <input type="text" placeholder='e.g. 48"x40"x48"'
                          value={postForm.dims}
                          onChange={e => setPostForm(f => ({ ...f, dims: e.target.value }))} />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="dat-form-row">
                    <div className="dat-field">
                      <label><MapPin size={14} /> Current Location (Zip)</label>
                      <input type="text" placeholder="e.g. 90001" maxLength={5}
                        value={postForm.originZip}
                        onChange={e => setPostForm(f => ({ ...f, originZip: e.target.value }))} />
                    </div>
                    <div className="dat-field">
                      <label><MapPin size={14} /> Preferred Destination (Zip)</label>
                      <input type="text" placeholder="e.g. 33101" maxLength={5}
                        value={postForm.destinationZip}
                        onChange={e => setPostForm(f => ({ ...f, destinationZip: e.target.value }))} />
                    </div>
                    <div className="dat-field">
                      <label><Truck size={14} /> Equipment Type</label>
                      <select value={postForm.equipmentType}
                        onChange={e => setPostForm(f => ({ ...f, equipmentType: e.target.value }))}>
                        {EQUIPMENT_COMMON.map(eq => (
                          <option key={eq.code} value={eq.code}>{eq.code} - {eq.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="dat-form-row">
                    <div className="dat-field">
                      <label><Calendar size={14} /> Available Date</label>
                      <input type="date" value={postForm.availableDate}
                        onChange={e => setPostForm(f => ({ ...f, availableDate: e.target.value }))} />
                    </div>
                    <div className="dat-field">
                      <label>Capacity (lbs)</label>
                      <input type="number" placeholder="e.g. 44000"
                        value={postForm.capacity}
                        onChange={e => setPostForm(f => ({ ...f, capacity: e.target.value }))} />
                    </div>
                    <div className="dat-field">
                      <label>Length (ft)</label>
                      <input type="number" placeholder="e.g. 53"
                        value={postForm.length}
                        onChange={e => setPostForm(f => ({ ...f, length: e.target.value }))} />
                    </div>
                  </div>
                  <div className="dat-form-row">
                    <div className="dat-field full-width">
                      <label>Comment</label>
                      <input type="text" placeholder="Additional notes"
                        value={postForm.comment}
                        onChange={e => setPostForm(f => ({ ...f, comment: e.target.value }))} />
                    </div>
                  </div>
                </>
              )}
              <div className="dat-form-actions">
                <button type="submit" className="dat-btn dat-btn-primary" disabled={loading}>
                  {loading ? <Loader size={16} className="spin" /> : <Send size={16} />}
                  Post {postType === 'load' ? 'Load' : 'Truck'} to DAT
                </button>
              </div>
            </form>
          </div>
        )}

        {/* My Posts Tab */}
        {activeTab === 'my-posts' && (
          <div className="dat-section">
            <div className="dat-section-header">
              <h3><Package size={20} /> My DAT Posts</h3>
              <div className="dat-toggle">
                {['active', 'matched', 'deleted', ''].map(status => (
                  <button key={status || 'all'}
                    className={postsFilter === status ? 'active' : ''}
                    onClick={() => setPostsFilter(status)}>
                    {status || 'All'}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="dat-loading"><Loader size={24} className="spin" /> Loading posts...</div>
            ) : myPosts.length === 0 ? (
              <p className="dat-empty">No DAT posts found.</p>
            ) : (
              <div className="dat-results-table">
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>DAT Post ID</th>
                      <th>Equipment</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Last Refreshed</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myPosts.map(post => (
                      <tr key={post.id}>
                        <td>
                          <span className={`dat-type-badge ${post.postType}`}>
                            {post.postType === 'load' ? <Package size={12} /> : <Truck size={12} />}
                            {post.postType}
                          </span>
                        </td>
                        <td className="mono">{post.datPostId}</td>
                        <td><span className="dat-equip-badge">{post.equipmentType || '-'}</span></td>
                        <td><span className={`dat-status-badge ${post.status}`}>{post.status}</span></td>
                        <td>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '-'}</td>
                        <td>{post.lastRefreshedAt ? new Date(post.lastRefreshedAt).toLocaleString() : '-'}</td>
                        <td className="dat-actions">
                          {post.status === 'active' && (
                            <>
                              <button className="dat-btn-icon" title="Refresh"
                                disabled={actionLoading === post.datPostId}
                                onClick={() => handleRefresh(post)}>
                                {actionLoading === post.datPostId ? <Loader size={14} className="spin" /> : <RefreshCw size={14} />}
                              </button>
                              <button className="dat-btn-icon danger" title="Delete"
                                disabled={actionLoading === post.datPostId}
                                onClick={() => handleDelete(post)}>
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DATLoadBoard;
