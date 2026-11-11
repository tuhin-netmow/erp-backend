const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { S3Client, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');
const { success, error, successWithPagination } = require('../../core/utils/response');
const { Gallery } = require('./upload.model');

// Check if DO credentials are provided and valid
const getUseDO = () => {
    return process.env.DO_BUCKET &&
        process.env.DO_BUCKET !== 'your-bucket-name' &&
        process.env.DO_KEY &&
        process.env.DO_SECRETE;
}

const useDO = getUseDO();

console.log(`[Upload Configuration] Digital Ocean Logic Enabled: ${!!useDO}`);
if (useDO) {
    console.log(`[Upload Configuration] Bucket: ${process.env.DO_BUCKET}, Region: ${process.env.DO_REGION}`);
} else {
    console.log(`[Upload Configuration] Using Local Storage`);
}

let s3Client;
let storage;

if (useDO) {
    try {
        const { S3Client } = require('@aws-sdk/client-s3');
        s3Client = new S3Client({
            endpoint: process.env.DO_ENDPOINT || 'https://nyc3.digitaloceanspaces.com',
            region: process.env.DO_REGION || 'nyc3',
            forcePathStyle: true, // Required for buckets with dots (e.g. kaoser.inleadsit) to avoid SSL mismatch
            credentials: {
                accessKeyId: process.env.DO_KEY,
                secretAccessKey: process.env.DO_SECRETE
            }
        });

        storage = multerS3({
            s3: s3Client,
            bucket: process.env.DO_BUCKET,
            acl: 'public-read',
            contentType: multerS3.AUTO_CONTENT_TYPE,
            key: function (req, file, cb) {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = path.extname(file.originalname);
                const nameWithoutExt = path.basename(file.originalname, ext);
                // Sanitize filename
                const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
                // Store in uploads/images/ directory within the bucket
                cb(null, `uploads/images/${sanitizedName}-${uniqueSuffix}${ext}`);
            }
        });
    } catch (configError) {
        console.error("Error Configuring S3 Client:", configError);
        // Fallback or just let it crash safely?
        // If s3 config fails, we might want to fallback to local?
        // But for now let's just log it.
    }
} else {
    // Local storage configuration
    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadDir = path.join(__dirname, '../../../public/uploads/images');

            // Create directory if it doesn't exist
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            // Generate unique filename: timestamp-randomstring-originalname
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            const nameWithoutExt = path.basename(file.originalname, ext);
            const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
            cb(null, sanitizedName + '-' + uniqueSuffix + ext);
        }
    });
}

// File filter - only allow images
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
});

class UploadController {
    // Helper to get file URL and properties regardless of storage provider
    _getFileProps(file) {
        if (useDO) {
            // S3/DO Spaces file object properties
            // multer-s3 returns location (full URL) and key
            return {
                filename: path.basename(file.key), // Extract filename from key
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                url: file.location, // Full DO Space URL
                path: file.key // Use key as path reference
            };
        } else {
            // Local file object properties
            return {
                filename: file.filename,
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                url: `/uploads/images/${file.filename}`,
                path: file.path
            };
        }
    }

    // Single image upload
    async uploadImage(req, res) {
        try {
            // Handle both single file (req.file) and any file (req.files)
            const file = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);

            if (!file) {
                return error(res, 'No file uploaded', 400);
            }

            const fileProps = this._getFileProps(file);

            // Extract metadata from request body
            const { caption, description, alt_text } = req.body;

            // Save to database
            const galleryItem = await Gallery.create({
                ...fileProps,
                caption: caption || null,
                description: description || null,
                alt_text: alt_text || null,
                uploaded_by: req.user ? req.user.id : null
            });

            return success(res, 'Image uploaded successfully', {
                ...fileProps,
                id: galleryItem.id,
                meta: {
                    caption: caption || null,
                    description: description || null,
                    alt_text: alt_text || null
                }
            }, 201);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    // Multiple images upload
    async uploadMultipleImages(req, res) {
        try {
            if (!req.files || req.files.length === 0) {
                return error(res, 'No files uploaded', 400);
            }

            // Extract metadata
            let metadata = [];
            if (req.body.metadata) {
                try {
                    metadata = JSON.parse(req.body.metadata);
                } catch (e) {
                    // Ignore parse error
                }
            }

            const { caption, description, alt_text } = req.body;

            const uploadPromises = req.files.map(async (file, index) => {
                const fileProps = this._getFileProps(file);

                // Determine metadata for this specific file
                let fileMeta = {};

                if (metadata[index]) {
                    fileMeta = metadata[index];
                } else {
                    fileMeta = {
                        caption: Array.isArray(caption) ? caption[index] : caption,
                        description: Array.isArray(description) ? description[index] : description,
                        alt_text: Array.isArray(alt_text) ? alt_text[index] : alt_text
                    };
                }

                // Save to database
                const galleryItem = await Gallery.create({
                    ...fileProps,
                    caption: fileMeta.caption || null,
                    description: fileMeta.description || null,
                    alt_text: fileMeta.alt_text || null,
                    uploaded_by: req.user ? req.user.id : null
                });

                return {
                    ...fileProps,
                    id: galleryItem.id,
                    meta: {
                        caption: fileMeta.caption || null,
                        description: fileMeta.description || null,
                        alt_text: fileMeta.alt_text || null
                    }
                };
            });

            const uploadedFiles = await Promise.all(uploadPromises);

            return success(res, `${uploadedFiles.length} images uploaded successfully`, {
                count: uploadedFiles.length,
                files: uploadedFiles
            }, 201);
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    // Delete image
    async deleteImage(req, res) {
        try {
            const { filename } = req.params;

            // Delete from database first
            await Gallery.destroy({ where: { filename: filename } });

            if (useDO) {
                // Delete from DO Spaces
                const key = `uploads/images/${filename}`;

                try {
                    await s3Client.send(new DeleteObjectCommand({
                        Bucket: process.env.DO_BUCKET,
                        Key: key
                    }));

                    return success(res, 'Image deleted successfully', {
                        filename: filename
                    });
                } catch (s3Err) {
                    console.error('S3 Delete Error:', s3Err);
                    return success(res, 'Image deleted from DB but failed/missing on S3', {
                        filename: filename
                    });
                }
            } else {
                // Delete from local filesystem
                const filePath = path.join(__dirname, '../../../public/uploads/images', filename);

                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }

                return success(res, 'Image deleted successfully', {
                    filename: filename
                });
            }
        } catch (err) {
            return error(res, err.message, 500);
        }
    }

    // List all uploaded images
    async listImages(req, res) {
        try {
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 12;
            const offset = (page - 1) * limit;

            // Fetch from database
            const { count, rows: images } = await Gallery.findAndCountAll({
                limit,
                offset,
                order: [['created_at', 'DESC']],
                include: [
                    {
                        association: 'uploader',
                        attributes: ['id', 'name', 'email']
                    }
                ]
            });

            // If DB is empty, maybe they just switched to DB. 
            // We could optionally list from storage as fallback, but better to stay consistent.

            return successWithPagination(res, 'Images retrieved successfully', images, {
                total: count,
                page,
                limit,
                totalPage: Math.ceil(count / limit)
            });

        } catch (err) {
            return error(res, err.message, 500);
        }
    }
}

module.exports = {
    UploadController: new UploadController(),
    uploadMiddleware: upload
};

