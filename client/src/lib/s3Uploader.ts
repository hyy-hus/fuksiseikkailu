import { generateUploadUrl } from '@/api/generated/sdk.gen'

export async function uploadPhotoToS3(
    file: File,
    onProgress?: (percent: number) => void
): Promise<{ url: string; key: string }> {
    // 1. Normalize content type explicitly
    const contentType = file.type?.toLowerCase() || 'image/jpeg'

    // 2. Request pre-signed URL with normalized MIME type
    const response = await generateUploadUrl({
        body: {
            filename: file.name,
            content_type: contentType,
        },
        throwOnError: true,
    })

    if (!response.data) {
        throw new Error('Failed to generate S3 pre-signed URL from backend')
    }

    const { upload_url, s3_key } = response.data

    // 3. Perform S3 PUT upload
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        if (onProgress && xhr.upload) {
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percent = Math.round((e.loaded / e.total) * 100)
                    onProgress(percent)
                }
            })
        }

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve({ url: upload_url.split('?')[0], key: s3_key })
            } else {
                reject(new Error(`S3 upload failed with status ${xhr.status}: ${xhr.responseText}`))
            }
        })

        xhr.addEventListener('error', () => reject(new Error('S3 upload network error')))
        xhr.addEventListener('abort', () => reject(new Error('S3 upload aborted')))

        xhr.open('PUT', upload_url)
        // Ensure identical Content-Type used during URL signing
        xhr.setRequestHeader('Content-Type', contentType)

        // Pass x-amz-acl header required by signature
        xhr.setRequestHeader('x-amz-acl', 'public-read')

        xhr.send(file)
    })
}
