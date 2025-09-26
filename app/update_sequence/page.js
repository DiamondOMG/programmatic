'use client'

import { useState } from 'react'
import { updateSequence } from './update_sequence'

// ฟังก์ชันแปลง datetime-local เป็น UnixTime UTC (ลบ 7 ชมสำหรับไทย timezone)
function convertToUnixTime(dateTimeString) {
  if (!dateTimeString) return null

  // สร้าง Date object จาก datetime-local string
  const date = new Date(dateTimeString)

  // ลบ 7 ชมสำหรับไทย timezone เพื่อแปลงเป็น UTC
  const utcTime = date.getTime()

  return utcTime.toString()
}

export default function UpdateSequencePage() {
  const [libraryId, setLibraryId] = useState('')
  const [startDateTime, setStartDateTime] = useState('')
  const [endDateTime, setEndDateTime] = useState('')
  const [duration, setDuration] = useState('')
  const [label, setLabel] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') // 'success' or 'error'

  // Duration options
  const durationOptions = [
    { value: '900000', label: '15s' }, // 15 * 60 * 1000
    { value: '1800000', label: '30s' } // 30 * 60 * 1000
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!libraryId || !label || !duration) {
      setMessage('Please fill in all required fields')
      setMessageType('error')
      return
    }

    // ตรวจสอบว่าวันเริ่มต้องก่อนวันจบ (ถ้ามีการกรอกทั้งคู่)
    if (startDateTime && endDateTime) {
      const startUnix = convertToUnixTime(startDateTime)
      const endUnix = convertToUnixTime(endDateTime)

      if (startUnix >= endUnix) {
        setMessage('Start date must be before end date')
        setMessageType('error')
        return
      }
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('libraryId', libraryId)
      formData.append('startDateTime', convertToUnixTime(startDateTime))
      formData.append('endDateTime', convertToUnixTime(endDateTime))
      formData.append('duration', duration)
      formData.append('label', label)

      const result = await updateSequence(formData)

      if (result.success) {
        setMessage('Sequence updated successfully')
        setMessageType('success')
        // Reset form
        setLibraryId('')
        setStartDateTime('')
        setEndDateTime('')
        setDuration('')
        setLabel('')
      } else {
        setMessage(result.error)
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Error updating sequence')
      setMessageType('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Library ID */}
          <div>
            <label htmlFor="sequence-library-id" className="block text-sm font-medium text-gray-700 mb-2">
              Library ID *
            </label>
            <input
              type="text"
              id="sequence-library-id"
              name="libraryId"
              value={libraryId}
              onChange={(e) => setLibraryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter Library ID"
              disabled={isSubmitting}
            />
          </div>

          {/* Start Date Time */}
          <div>
            <label htmlFor="sequence-start-date" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date (Optional)
            </label>
            <input
              type="datetime-local"
              id="sequence-start-date"
              name="startDateTime"
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          {/* End Date Time */}
          <div>
            <label htmlFor="sequence-end-date" className="block text-sm font-medium text-gray-700 mb-2">
              End Date (Optional)
            </label>
            <input
              type="datetime-local"
              id="sequence-end-date"
              name="endDateTime"
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          {/* Duration */}
          <div>
            <label htmlFor="sequence-duration" className="block text-sm font-medium text-gray-700 mb-2">
              Duration *
            </label>
            <select
              id="sequence-duration"
              name="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              <option value="">Select Duration</option>
              {durationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Label */}
          <div>
            <label htmlFor="sequence-label" className="block text-sm font-medium text-gray-700 mb-2">
              Label *
            </label>
            <input
              type="text"
              id="sequence-label"
              name="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter Label"
              disabled={isSubmitting}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !libraryId || !label || !duration}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Updating...' : 'Update Sequence'}
          </button>
        </form>

        {/* Status Message */}
        {message && (
          <div className={`mt-4 p-3 rounded-md ${
            messageType === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}