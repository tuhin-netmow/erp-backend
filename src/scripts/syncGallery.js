const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { Gallery } = require('../modules/upload/upload.model');

async function syncS3ToGallery() {
    console.log('Starting S3 to Gallery Sync...');

    const s3Client = new S3Client({
        endpoint: process.env.DO_ENDPOINT,
        region: process.env.DO_REGION,
        forcePathStyle: true,
        credentials: {
            accessKeyId: process.env.DO_KEY,
            secretAccessKey: process.env.DO_SECRETE
        }
    });

    try {
        console.log(`Bucket: ${process.env.DO_BUCKET}, Prefix: uploads/images/`);
        const command = new ListObjectsV2Command({
            Bucket: process.env.DO_BUCKET,
            Prefix: 'uploads/images/'
        });

        console.log('Sending ListObjectsV2Command to S3...');
        const response = await s3Client.send(command);
        console.log('S3 Response status color:', response.$metadata?.httpStatusCode);
        const contents = response.Contents || [];

        console.log(`Found ${contents.length} objects in S3.`);

        let added = 0;
        let skipped = 0;

        for (const item of contents) {
            const fname = path.basename(item.Key);
            const ext = path.extname(fname).toLowerCase();
            if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) continue;

            const url = `${process.env.DO_ENDPOINT}/${process.env.DO_BUCKET}/${item.Key}`;

            // Check if exists
            const [item_db, created] = await Gallery.findOrCreate({
                where: { filename: fname },
                defaults: {
                    filename: fname,
                    originalname: fname,
                    mimetype: `image/${ext.replace('.', '')}`,
                    size: item.Size,
                    url: url,
                    path: item.Key,
                    created_at: item.LastModified,
                    updated_at: item.LastModified
                }
            });

            if (created) added++;
            else skipped++;
        }

        console.log(`Sync complete. Added: ${added}, Skipped: ${skipped}.`);
        process.exit(0);

    } catch (err) {
        console.error('Sync failed:', err);
        process.exit(1);
    }
}

syncS3ToGallery();
