"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  FileText, 
  Building2,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Download,
  ChevronDown,
  Filter
} from "lucide-react";

interface WholesaleApplication {
  id: string;
  customer_id: string;
  business_name: string;
  business_type?: string;
  business_address: {
    address_1: string;
    address_2?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  license_number: string;
  license_expiry: string;
  license_document_url?: string;
  tax_id: string;
  resale_certificate_url?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  reviewed_at?: string;
  reviewed_by?: string;
  review_notes?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

export default function WholesaleApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<WholesaleApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<WholesaleApplication | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    loadApplications();
  }, [selectedStatus]);

  async function loadApplications() {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      
      const { data } = await axios.get(`/api/wholesale/applications?${params.toString()}`);
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Load applications error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function approveApplication(applicationId: string) {
    if (!confirm('Are you sure you want to approve this wholesale application?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      
      // Get admin user ID from localStorage or session
      const adminId = localStorage.getItem('admin_id') || 'system';
      
      await axios.post(`/api/wholesale/applications/${applicationId}/approve`, {
        adminId,
        notes: reviewNotes
      });
      
      alert('Application approved successfully!');
      setShowModal(false);
      loadApplications();
    } catch (error: any) {
      console.error('Approve error:', error);
      alert('Failed to approve application: ' + (error.response?.data?.error || error.message));
    } finally {
      setActionLoading(false);
    }
  }

  async function rejectApplication(applicationId: string) {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    
    if (!confirm('Are you sure you want to reject this wholesale application?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      
      const adminId = localStorage.getItem('admin_id') || 'system';
      
      await axios.post(`/api/wholesale/applications/${applicationId}/reject`, {
        adminId,
        reason: rejectionReason
      });
      
      alert('Application rejected');
      setShowModal(false);
      loadApplications();
    } catch (error: any) {
      console.error('Reject error:', error);
      alert('Failed to reject application: ' + (error.response?.data?.error || error.message));
    } finally {
      setActionLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    const badges = {
      pending: { icon: Clock, color: 'text-yellow-400 bg-yellow-400/10' },
      under_review: { icon: Eye, color: 'text-blue-400 bg-blue-400/10' },
      approved: { icon: CheckCircle, color: 'text-green-400 bg-green-400/10' },
      rejected: { icon: XCircle, color: 'text-red-400 bg-red-400/10' }
    };
    
    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${badge.color}`}>
        <Icon size={14} />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-thin text-white/90 tracking-tight mb-2">Wholesale Review</h1>
          <p className="text-white/40 text-xs font-light tracking-wide">MANAGE ACCESS REQUESTS</p>
        </div>

        {/* Filters */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter size={20} className="text-white/40" />
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white/5 border border-white/10 rounded px-4 py-2 text-white focus:outline-none focus:border-white/30"
            >
              <option value="all">All Applications</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            
            <div className="ml-auto text-sm text-white/60">
              {applications.length} application{applications.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/60">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <p className="text-white/60">No applications found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Building2 className="w-5 h-5 text-white/40" />
                      <h3 className="text-lg font-medium">{app.business_name}</h3>
                      {getStatusBadge(app.status)}
                    </div>
                    
                    {app.customer && (
                      <p className="text-sm text-white/60 mb-2">
                        {app.customer.first_name} {app.customer.last_name} • {app.customer.email}
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => {
                      setSelectedApplication(app);
                      setShowModal(true);
                      setReviewNotes("");
                      setRejectionReason("");
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-sm font-medium transition-all"
                  >
                    Review
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-white/40 mb-1">Business Type</p>
                    <p className="font-medium">{app.business_type || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <p className="text-white/40 mb-1">License #</p>
                    <p className="font-mono text-xs">{app.license_number}</p>
                  </div>
                  
                  <div>
                    <p className="text-white/40 mb-1">Tax ID</p>
                    <p className="font-mono text-xs">{app.tax_id}</p>
                  </div>
                  
                  <div>
                    <p className="text-white/40 mb-1">Applied</p>
                    <p>{new Date(app.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/20 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-2xl font-light">Review Application</h2>
              <p className="text-white/60 text-sm mt-1">{selectedApplication.business_name}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Business Information */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Building2 size={20} className="text-white/40" />
                  Business Information
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/40 mb-1 block">Business Name</label>
                    <p className="font-medium">{selectedApplication.business_name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-white/40 mb-1 block">Business Type</label>
                    <p className="font-medium">{selectedApplication.business_type || 'N/A'}</p>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="text-sm text-white/40 mb-1 block">Business Address</label>
                    <p className="font-medium">
                      {selectedApplication.business_address.address_1}
                      {selectedApplication.business_address.address_2 && `, ${selectedApplication.business_address.address_2}`}
                      <br />
                      {selectedApplication.business_address.city}, {selectedApplication.business_address.state} {selectedApplication.business_address.postcode}
                    </p>
                  </div>
                </div>
              </div>

              {/* License & Tax Info */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-white/40" />
                  License & Tax Information
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/40 mb-1 block">License Number</label>
                    <p className="font-mono text-sm">{selectedApplication.license_number}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-white/40 mb-1 block">License Expiry</label>
                    <p className="font-medium">{new Date(selectedApplication.license_expiry).toLocaleDateString()}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-white/40 mb-1 block">Tax ID</label>
                    <p className="font-mono text-sm">{selectedApplication.tax_id}</p>
                  </div>
                  
                  {selectedApplication.license_document_url && (
                    <div>
                      <label className="text-sm text-white/40 mb-1 block">License Document</label>
                      <a
                        href={selectedApplication.license_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                      >
                        <Download size={14} />
                        View Document
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              {selectedApplication.contact_person && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-white/40 mb-1 block">Contact Person</label>
                      <p className="font-medium">{selectedApplication.contact_person}</p>
                    </div>
                    
                    {selectedApplication.contact_phone && (
                      <div>
                        <label className="text-sm text-white/40 mb-1 block">Phone</label>
                        <p className="font-medium">{selectedApplication.contact_phone}</p>
                      </div>
                    )}
                    
                    {selectedApplication.contact_email && (
                      <div>
                        <label className="text-sm text-white/40 mb-1 block">Email</label>
                        <p className="font-medium">{selectedApplication.contact_email}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Review Actions */}
              {selectedApplication.status === 'pending' || selectedApplication.status === 'under_review' ? (
                <div>
                  <h3 className="text-lg font-medium mb-4">Review Decision</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-white/40 mb-2 block">Review Notes</label>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Add notes about this application..."
                        className="w-full bg-white/5 border border-white/10 rounded p-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => approveApplication(selectedApplication.id)}
                        disabled={actionLoading}
                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <CheckCircle size={18} />
                        Approve Application
                      </button>
                      
                      <button
                        onClick={() => {
                          const reason = prompt('Rejection reason:');
                          if (reason) {
                            setRejectionReason(reason);
                            rejectApplication(selectedApplication.id);
                          }
                        }}
                        disabled={actionLoading}
                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <XCircle size={18} />
                        Reject Application
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <p className="text-white/60 text-sm mb-2">
                    Status: {getStatusBadge(selectedApplication.status)}
                  </p>
                  
                  {selectedApplication.reviewed_at && (
                    <p className="text-white/60 text-sm">
                      Reviewed: {new Date(selectedApplication.reviewed_at).toLocaleString()}
                    </p>
                  )}
                  
                  {selectedApplication.review_notes && (
                    <p className="text-white/60 text-sm mt-2">
                      Notes: {selectedApplication.review_notes}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/10">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

