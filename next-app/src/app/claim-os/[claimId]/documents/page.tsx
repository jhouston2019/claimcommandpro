'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Upload, FileText, Image, File, Download, Trash2, Eye } from 'lucide-react'

interface Document {
  id: string
  file_name: string
  file_url: string
  file_type: string
  file_category: string
  file_size: number
  uploaded_at: string
  is_processed: boolean
}

export default function DocumentsPage({ params }: { params: { claimId: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showUploadModal, setShowUploadModal] = useState(false)

  useEffect(() => {
    loadDocuments()
    if (searchParams.get('upload') === 'true') {
      setShowUploadModal(true)
    }
  }, [params.claimId])

  const loadDocuments = async () => {
    try {
      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('claim_id', params.claimId)
        .order('uploaded_at', { ascending: false })

      setDocuments(data || [])
    } catch (error) {
      console.error('Failed to load documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const formData = new FormData(e.currentTarget)
      const file = formData.get('file') as File
      const fileType = formData.get('fileType') as string
      const category = formData.get('category') as string

      if (!file) return

      const filePath = `${user.id}/${params.claimId}/${fileType}_${Date.now()}_${file.name}`
      
      const { error: uploadError } = await supabase.storage
        .from('claim-documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('claim-documents')
        .getPublicUrl(filePath)

      await supabase.from('documents').insert({
        claim_id: params.claimId,
        user_id: user.id,
        file_name: file.name,
        file_url: publicUrl,
        file_type: fileType,
        file_category: category,
        storage_path: filePath,
        file_size: file.size,
        mime_type: file.type
      })

      await supabase.rpc('log_claim_event', {
        p_claim_id: params.claimId,
        p_user_id: user.id,
        p_event_type: 'document_uploaded',
        p_event_title: 'Document Uploaded',
        p_event_description: `Uploaded ${file.name}`
      })

      setShowUploadModal(false)
      loadDocuments()

    } catch (error: any) {
      console.error('Upload failed:', error)
      alert('Failed to upload document: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (docId: string, storagePath: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      await supabase.storage.from('claim-documents').remove([storagePath])
      await supabase.from('documents').delete().eq('id', docId)
      loadDocuments()
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete document')
    }
  }

  const categories = [
    { value: 'all', label: 'All Documents' },
    { value: 'policy', label: 'Policy' },
    { value: 'estimates', label: 'Estimates' },
    { value: 'photos', label: 'Photos' },
    { value: 'receipts', label: 'Receipts' },
    { value: 'reports', label: 'Reports' },
    { value: 'correspondence', label: 'Correspondence' }
  ]

  const filteredDocs = selectedCategory === 'all' 
    ? documents 
    : documents.filter(d => d.file_category === selectedCategory)

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return <Image className="w-5 h-5 text-blue-600" />
    return <File className="w-5 h-5 text-gray-600" />
  }

  return (
    <div className="p-6">
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Vault</h1>
          <p className="text-gray-600">Manage all claim-related documents in one place</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {cat.label}
            {cat.value !== 'all' && (
              <span className="ml-2 text-xs opacity-75">
                ({documents.filter(d => d.file_category === cat.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Documents Yet</h3>
          <p className="text-gray-600 mb-6">Upload your first document to get started</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div key={doc.id} className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                {getFileIcon(doc.mime_type)}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{doc.file_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{doc.file_type.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
              </div>
              <div className="flex gap-2">
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded text-xs font-semibold hover:bg-blue-100"
                >
                  <Eye className="w-3 h-3" />
                  View
                </a>
                <a
                  href={doc.file_url}
                  download
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-50 text-green-600 rounded text-xs font-semibold hover:bg-green-100"
                >
                  <Download className="w-3 h-3" />
                  Download
                </a>
                <button
                  onClick={() => handleDelete(doc.id, doc.storage_path)}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded text-xs font-semibold hover:bg-red-100"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Document</h2>
            
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Document Type *
                </label>
                <select
                  name="fileType"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select type</option>
                  <option value="policy">Insurance Policy</option>
                  <option value="estimate_carrier">Carrier Estimate</option>
                  <option value="estimate_contractor">Contractor Estimate</option>
                  <option value="photo">Photo</option>
                  <option value="receipt">Receipt</option>
                  <option value="invoice">Invoice</option>
                  <option value="report">Report</option>
                  <option value="correspondence">Correspondence</option>
                  <option value="supplement">Supplement</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select category</option>
                  <option value="policy">Policy</option>
                  <option value="estimates">Estimates</option>
                  <option value="photos">Photos</option>
                  <option value="receipts">Receipts</option>
                  <option value="reports">Reports</option>
                  <option value="correspondence">Correspondence</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  File *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <label className="cursor-pointer">
                    <span className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                      Choose file
                    </span>
                    <input
                      type="file"
                      name="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      required
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG, DOC</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 btn-secondary"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
