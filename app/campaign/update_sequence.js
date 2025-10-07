'use server'

// อ่าน environment variables สำหรับ Basic Auth
const STACKS_USERNAME = process.env.STACKS_USERNAME
const STACKS_PASSWORD = process.env.STACKS_PASSWORD

// API endpoint สำหรับ update sequence
const SEQUENCE_API_URL = 'https://stacks.targetr.net/rest-api/v1/op/sequence/13653C81488E4C/2'

// ฟังก์ชันสร้าง modifiedMillis (Unix timestamp 13 หลัก)
function generateModifiedMillis() {
  return Date.now().toString()
}

// Main server action สำหรับ update sequence
export async function updateSequence(formData) {
  try {
    const libraryId = formData.get('libraryId')
    const startDateTime = formData.get('startDateTime') // รับเป็น UnixTime UTC แล้ว
    const endDateTime = formData.get('endDateTime') // รับเป็น UnixTime UTC แล้ว
    const duration = formData.get('duration')


    if (!STACKS_USERNAME || !STACKS_PASSWORD) {
      return { success: false, error: 'ไม่พบข้อมูลการยืนยันตัวตนใน environment variables' }
    }

    // เตรียม request body
    const requestBody = {
      type: "libraryitem",
      id: libraryId,
      data: {
        modifiedMillis: generateModifiedMillis(),
      }
    }

    // เพิ่ม startMillis ถ้ามี
    if (startDateTime) {
      requestBody.data.startMillis = startDateTime
    }

    // เพิ่ม endMillis ถ้ามี
    if (endDateTime) {
      requestBody.data.endMillis = endDateTime
    }

    // เพิ่ม durationMillis ถ้ามี
    if (duration) {
      requestBody.data.durationMillis = duration
    }

    const auth = Buffer.from(`${STACKS_USERNAME}:${STACKS_PASSWORD}`).toString('base64')

    const response = await fetch(SEQUENCE_API_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`Failed to update sequence: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    return {
      success: true,
      message: 'อัปเดต sequence สำเร็จ',
      data: result
    }

  } catch (error) {
    console.error('Update sequence error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปเดต sequence'
    }
  }
}