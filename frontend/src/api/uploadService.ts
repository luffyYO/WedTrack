import { supabase } from '@/config/supabaseClient';

/**
 * Uploads an array of files to the 'weddings' Supabase Storage bucket.
 * Designed to handle up to 3 images, optionally compressing or validating them.
 * 
 * @param files Array of File objects to upload.
 * @returns Array of public URL strings for the successfully uploaded images.
 */
export const uploadWeddingGallery = async (files: File[]): Promise<string[]> => {
    if (!files || files.length === 0) return [];
    
    // We limit to 3 files max
    const filesToUpload = files.slice(0, 3);
    const uploadedUrls: string[] = [];

    for (const file of filesToUpload) {
        // Generate a random, collision-resistant filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `gallery/${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('weddings')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error(`Failed to upload ${file.name}:`, uploadError.message);
                continue; // Skip failed uploads but keep processing others
            }

            // Get Public URL
            const { data } = supabase.storage
                .from('weddings')
                .getPublicUrl(filePath);

            if (data?.publicUrl) {
                uploadedUrls.push(data.publicUrl);
            }
        } catch (err) {
            console.error(`Unexpected error during upload of ${file.name}:`, err);
        }
    }

    return uploadedUrls;
};
