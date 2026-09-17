export async function uploadPhotoToS3(
    file: File,
    _onProgress?: (percent: number) => void
): Promise<{ url: string; key: string }> {
    const fileExt = file.name.split('.').pop() || 'jpg'
    const uniqueFileName = `photos/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`

    // Bucket target URL
    const s3BucketUrl = 'https://app.fuksiseikkailu.fi'
    const uploadUrl = `${s3BucketUrl}/${uniqueFileName}`

    const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': file.type,
        },
        body: file,
    })

    if (!response.ok) {
        throw new Error(`S3 upload failed with status ${response.status}`)
    }

    return {
        url: uploadUrl,
        key: uniqueFileName,
    }
}
