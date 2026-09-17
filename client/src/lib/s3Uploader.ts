import { generateUploadUrl } from '@/api/generated/sdk.gen'

export async function uploadPhotoToS3(
    file: File,
    onProgress?: (percent: number) => void
): Promise<{ url: string; key: string }> {
    // 1. Get pre-signed URL directly from the generated Hey API SDK helper
    const response = await generateUploadUrl({
        body: {
            filename: file.name,
            content_type: file.type || 'image/jpeg',
        },
        throwOnError: true,
    })

    if (!response.data) {
        throw new Error('Failed to generate S3 pre-signed URL from backend')
    }

    const { upload_url, s3_key } = response.data

    // 2. Perform direct S3 upload using XHR to support progress tracking
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
                reject(new Error(`S3 upload failed with status ${xhr.status}`))
            }
        })

        xhr.addEventListener('error', () => reject(new Error('S3 upload network error')))
        xhr.addEventListener('abort', () => reject(new Error('S3 upload aborted')))

        xhr.open('PUT', upload_url)
        xhr.setRequestHeader('Content-Type', file.type || 'image/jpeg')
        xhr.setRequestHeader('x-amz-acl', 'public-read')
        xhr.send(file)
    })
}
