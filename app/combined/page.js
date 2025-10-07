'use client'

import { useState, useRef, useEffect } from "react"
import { uploadAsset } from "../content/upload_library"
import { updateSequence } from "../campaign/update_sequence"

// ฟังก์ชันแปลง datetime-local เป็น UnixTime UTC (ลบ 7 ชมสำหรับไทย timezone)
function convertToUnixTime(dateTimeString) {
  if (!dateTimeString) return null

  // สร้าง Date object จาก datetime-local string
  const date = new Date(dateTimeString)

  // ลบ 7 ชมสำหรับไทย timezone เพื่อแปลงเป็น UTC
  const utcTime = date.getTime()

  return utcTime.toString()
}

export default function CombinedPage() {
  // Content Upload States (Left Side)
  const [contentLabel, setContentLabel] = useState("")
  const [contentFile, setContentFile] = useState(null)
  const [isContentDragOver, setIsContentDragOver] = useState(false)
  const [isContentUploading, setIsContentUploading] = useState(false)
  const [contentMessage, setContentMessage] = useState("")
  const [contentMessageType, setContentMessageType] = useState("")
  const [contentLibraryId, setContentLibraryId] = useState("")
  const contentFileInputRef = useRef(null)

  // Campaign States (Right Side)
  const [campaignLibraryId, setCampaignLibraryId] = useState('')
  const [campaignStartDateTime, setCampaignStartDateTime] = useState('')
  const [campaignEndDateTime, setCampaignEndDateTime] = useState('')
  const [campaignDuration, setCampaignDuration] = useState('')
  const [isCampaignSubmitting, setIsCampaignSubmitting] = useState(false)
  const [campaignMessage, setCampaignMessage] = useState('')
  const [campaignMessageType, setCampaignMessageType] = useState('')

  // Duration options for campaign
  const durationOptions = [
    { value: '900000', label: '15s' },
    { value: '1800000', label: '30s' }
  ]

  // Load library ID from localStorage on component mount
  useEffect(() => {
    const savedLibraryId = localStorage.getItem("lastLibraryId")
    if (savedLibraryId) {
      setContentLibraryId(savedLibraryId)
      setCampaignLibraryId(savedLibraryId) // Also set for campaign
    }
  }, [])

  // Clear library ID from localStorage
  const clearLibraryId = () => {
    localStorage.removeItem("lastLibraryId")
    setContentLibraryId("")
    setCampaignLibraryId("")
  }

  // Content Upload Handlers
  const handleContentDragOver = (e) => {
    e.preventDefault()
    setIsContentDragOver(true)
  }

  const handleContentDragLeave = (e) => {
    e.preventDefault()
    setIsContentDragOver(false)
  }

  const handleContentDrop = (e) => {
    e.preventDefault()
    setIsContentDragOver(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) {
      setContentFile(droppedFiles[0])
    }
  }

  const handleContentFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    if (selectedFiles.length > 0) {
      setContentFile(selectedFiles[0])
    }
  }

  const handleContentSubmit = async (e) => {
    e.preventDefault()

    if (!contentLabel || !contentFile) {
      setContentMessage("Please fill in label and select file")
      setContentMessageType("error")
      return
    }

    setIsContentUploading(true)
    setContentMessage("")

    try {
      const formData = new FormData()
      formData.append("label", contentLabel)
      formData.append("file", contentFile)

      const result = await uploadAsset(formData)

      if (result.success) {
        setContentMessage(result.message)
        setContentMessageType("success")
        setContentLibraryId(result.data.id)
        setCampaignLibraryId(result.data.id) // Also set for campaign
        localStorage.setItem("lastLibraryId", result.data.id)
        setContentLabel("")
        setContentFile(null)
      } else {
        setContentMessage(result.error)
        setContentMessageType("error")
      }
    } catch (error) {
      setContentMessage("Error uploading file")
      setContentMessageType("error")
    } finally {
      setIsContentUploading(false)
    }
  }

  // Campaign Handlers
  const handleCampaignSubmit = async (e) => {
    e.preventDefault()

    if (!campaignLibraryId || !campaignDuration) {
      setCampaignMessage('Please fill in all required fields')
      setCampaignMessageType('error')
      return
    }

    // ตรวจสอบว่าวันเริ่มต้องก่อนวันจบ (ถ้ามีการกรอกทั้งคู่)
    if (campaignStartDateTime && campaignEndDateTime) {
      const startUnix = convertToUnixTime(campaignStartDateTime)
      const endUnix = convertToUnixTime(campaignEndDateTime)

      if (startUnix >= endUnix) {
        setCampaignMessage('Start date must be before end date')
        setCampaignMessageType('error')
        return
      }
    }

    setIsCampaignSubmitting(true)
    setCampaignMessage('')

    try {
      const formData = new FormData()
      formData.append('libraryId', campaignLibraryId)
      formData.append('startDateTime', convertToUnixTime(campaignStartDateTime))
      formData.append('endDateTime', convertToUnixTime(campaignEndDateTime))
      formData.append('duration', campaignDuration)

      const result = await updateSequence(formData)

      if (result.success) {
        setCampaignMessage('Campaign updated successfully')
        setCampaignMessageType('success')
        // Reset form
        setCampaignLibraryId('')
        setCampaignStartDateTime('')
        setCampaignEndDateTime('')
        setCampaignDuration('')
      } else {
        setCampaignMessage(result.error)
        setCampaignMessageType('error')
      }
    } catch (error) {
      setCampaignMessage('Error updating campaign')
      setCampaignMessageType('error')
    } finally {
      setIsCampaignSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Content & Campaign Management
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Content Upload */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Add Content
            </h2>

            <form onSubmit={handleContentSubmit} className="space-y-4">
              {/* Content Label Input */}
              <div>
                <label
                  htmlFor="content-label"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Content Name *
                </label>
                <input
                  type="text"
                  id="content-label"
                  name="label"
                  value={contentLabel}
                  onChange={(e) => setContentLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter Content Name"
                  disabled={isContentUploading}
                />
              </div>

              {/* Content File Upload Area */}
              <div>
                <label
                  htmlFor="content-file"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  File *
                </label>

                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isContentDragOver
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  } ${
                    isContentUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  }`}
                  onDragOver={handleContentDragOver}
                  onDragLeave={handleContentDragLeave}
                  onDrop={handleContentDrop}
                  onClick={() => !isContentUploading && contentFileInputRef.current?.click()}
                >
                  {contentFile ? (
                    <div className="space-y-2">
                      <div className="text-green-600 font-medium">
                        ✓ {contentFile.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(contentFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-gray-500">
                        Drag file here or click to select file
                      </div>
                      <div className="text-sm text-gray-400">
                        Supports all file types
                      </div>
                    </div>
                  )}
                </div>

                <input
                  ref={contentFileInputRef}
                  type="file"
                  id="content-file"
                  name="file"
                  onChange={handleContentFileSelect}
                  className="hidden"
                  disabled={isContentUploading}
                />
              </div>

              {/* Content Submit Button */}
              <button
                type="submit"
                disabled={isContentUploading || !contentLabel || !contentFile}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isContentUploading ? "Uploading..." : "Upload Content"}
              </button>
            </form>

            {/* Content Status Message */}
            {contentMessage && (
              <div
                className={`mt-4 p-3 rounded-md ${
                  contentMessageType === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {contentMessage}
              </div>
            )}

            {/* Content Library ID Display */}
            {contentLibraryId && (
              <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-blue-800">Last Upload</h3>
                  <button
                    onClick={clearLibraryId}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">
                    Library ID
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={contentLibraryId}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm bg-white border border-blue-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(contentLibraryId)}
                      className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Campaign Management */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Campaign Management
            </h2>

            <form onSubmit={handleCampaignSubmit} className="space-y-4">
              {/* Campaign Library ID */}
              <div>
                <label htmlFor="campaign-library-id" className="block text-sm font-medium text-gray-700 mb-2">
                  Content ID *
                </label>
                <input
                  type="text"
                  id="campaign-library-id"
                  name="libraryId"
                  value={campaignLibraryId}
                  onChange={(e) => setCampaignLibraryId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter Content ID"
                  disabled={isCampaignSubmitting}
                />
              </div>

              {/* Campaign Start Date Time */}
              <div>
                <label htmlFor="campaign-start-date" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  id="campaign-start-date"
                  name="startDateTime"
                  value={campaignStartDateTime}
                  onChange={(e) => setCampaignStartDateTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isCampaignSubmitting}
                />
              </div>

              {/* Campaign End Date Time */}
              <div>
                <label htmlFor="campaign-end-date" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  id="campaign-end-date"
                  name="endDateTime"
                  value={campaignEndDateTime}
                  onChange={(e) => setCampaignEndDateTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isCampaignSubmitting}
                />
              </div>

              {/* Campaign Duration */}
              <div>
                <label htmlFor="campaign-duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Duration *
                </label>
                <select
                  id="campaign-duration"
                  name="duration"
                  value={campaignDuration}
                  onChange={(e) => setCampaignDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isCampaignSubmitting}
                >
                  <option value="">Select Duration</option>
                  {durationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campaign Submit Button */}
              <button
                type="submit"
                disabled={isCampaignSubmitting || !campaignLibraryId || !campaignDuration}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCampaignSubmitting ? 'Updating...' : 'Update Campaign'}
              </button>
            </form>

            {/* Campaign Status Message */}
            {campaignMessage && (
              <div className={`mt-4 p-3 rounded-md ${
                campaignMessageType === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {campaignMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
