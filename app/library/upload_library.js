'use server'

// อ่าน environment variables สำหรับ Basic Auth
const STACKS_USERNAME = process.env.STACKS_USERNAME
const STACKS_PASSWORD = process.env.STACKS_PASSWORD

// ฟังก์ชันสร้าง pendingId (เลขสุ่ม + timestamp)
function generatePendingId() {
  const randomNum = Math.floor(Math.random() * 1000000000)
  const timestamp = Date.now()
  return `${randomNum}${timestamp}`
}

function generateCreatedMillis() {
  return Date.now().toString()
}

// API 1: สร้าง library item
async function createLibraryItem(label) {
  const pendingId = generatePendingId()
  const createdMillis = generateCreatedMillis()

  const requestBody = {
    type: "libraryitem",
    data: {
      label: label,
      apiTest: "true"
    },
    resources: [
      {
        type: "pending",
        data: {
          pendingId: pendingId,
          createdMillis: createdMillis
        }
      }
    ]
  }

  const auth = Buffer.from(`${STACKS_USERNAME}:${STACKS_PASSWORD}`).toString('base64')

  const response = await fetch('https://stacks.targetr.net/rest-api/v1/libraryitems', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    throw new Error(`Failed to create library item: ${response.status} ${response.statusText}`)
  }

  const result = await response.json()
  return {
    id: result.id,
    pendingId: pendingId
  }
}

// API 2: Upload ไฟล์
async function uploadFile(file, itemId, pendingId, fileName) {
  const fileBuffer = Buffer.from(await file.arrayBuffer())

  const auth = Buffer.from(`${STACKS_USERNAME}:${STACKS_PASSWORD}`).toString('base64')

  const response = await fetch('https://stacks.targetr.net/upload', {
    method: 'POST',
    headers: {
      'X-UploadType': 'raw',
      'X-FileName': fileName,
      'X-ItemType': 'libraryitem',
      'Content-Type': 'content/unknown',
      'X-PendingId': pendingId,
      'X-ItemId': itemId,
      'Authorization': `Basic ${auth}`
    },
    body: fileBuffer
  })

  if (!response.ok) {
    throw new Error(`Failed to upload file: ${response.status} ${response.statusText}`)
  }

  return response
}

// Main server action
export async function uploadAsset(formData) {
  try {
    const label = formData.get('label')
    const file = formData.get('file')

    if (!label || !file) {
      return { success: false, error: 'Please fill in label and select file' }
    }

    if (!STACKS_USERNAME || !STACKS_PASSWORD) {
      return { success: false, error: 'Authentication credentials not found in environment variables' }
    }

    // Step 1: สร้าง library item
    const { id, pendingId } = await createLibraryItem(label)

    // Step 2: Upload ไฟล์
    await uploadFile(file, id, pendingId, file.name)

    return {
      success: true,
      message: 'Upload successful',
      data: { id }
    }

  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error uploading file'
    }
  }
}