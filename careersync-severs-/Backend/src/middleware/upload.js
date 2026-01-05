// src/middleware/upload.js
const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

// 1. Initialize Cloudflare R2 Client
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Helper to create S3 Storage Engine for specific folders
const createS3Storage = (folderName) => multerS3({
  s3: s3,
  bucket: process.env.R2_BUCKET_NAME,
  acl: 'public-read',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    // e.g. profiles/profile-176234234-8998.png
    const prefix = folderName === 'profiles' ? 'profile' : 'doc';
    const name = `${folderName}/${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});

// --- File Filters ---

// File filter for profile images (images only)
const imageFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed for profile!"), false);
  }
  cb(null, true);
};

// File filter for documents (PDF, images, docs)
const documentFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only PDF, images, and Word documents are allowed!"), false);
  }
  cb(null, true);
};

// File filter for strictly PDF
const pdfFilter = (req, file, cb) => {
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Only PDF files are allowed'), false);
  }
  cb(null, true);
};

// --- Upload Instances ---

// 1. Profile Image Upload (Saves to 'profiles/' folder in R2)
const uploadProfile = multer({ 
  storage: createS3Storage('profiles'), 
  fileFilter: imageFilter, 
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// 2. Documents Upload (Saves to 'documents/' folder in R2)
const uploadDocuments = multer({ 
  storage: createS3Storage('documents'), 
  fileFilter: documentFilter, 
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// 3. PDF Upload (Saves to 'documents/' folder in R2)
const uploadPDF = multer({ 
  storage: createS3Storage('documents'), 
  fileFilter: pdfFilter, 
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// 4. Position Image Upload (Saves to 'positions/' folder in R2)
const uploadPositionImage = multer({ 
  storage: createS3Storage('positions'), 
  fileFilter: imageFilter, 
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// --- Exports (Maintaining backward compatibility) ---

module.exports = {
  uploadProfile,
  uploadDocuments,
  uploadPDF,
  uploadPositionImage,

  // Wrapper for single file uploads that chooses the right uploader
  single: (fieldName) => {
    // If it's a profile image, use the profile uploader
    if (fieldName === 'profile_image' || fieldName === 'profileImage') {
      return uploadProfile.single(fieldName);
    }
    // If it's a position image, use the position image uploader
    if (fieldName === 'image_position' || fieldName === 'position_image') {
      return uploadPositionImage.single(fieldName);
    }
    // If it's strictly a PDF field (like agenda), use PDF uploader
    if (fieldName === 'agenda_pdf' || fieldName === 'file') {
      return uploadPDF.single(fieldName);
    }
    // Otherwise default to the general document uploader
    return uploadDocuments.single(fieldName);
  },

  // Wrapper for array uploads
  array: (fieldName, maxCount) => uploadDocuments.array(fieldName, maxCount),

  // Wrapper for mixed fields (e.g. Profile Pic + CV at same time)
  fields: (fields) => multer({ 
    storage: multerS3({
      s3: s3,
      bucket: process.env.R2_BUCKET_NAME,
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        // Sort files into correct R2 folders based on fieldname
        if (file.fieldname === 'profile_image') {
          cb(null, `profiles/profile-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
        } else if (file.fieldname === 'image_position' || file.fieldname === 'position_image') {
          cb(null, `positions/position-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
        } else {
          cb(null, `documents/doc-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
        }
      }
    }),
    fileFilter: (req, file, cb) => {
      // Basic check: just ensure it's one of our allowed types overall
      if (file.fieldname === 'profile_image' && !file.mimetype.startsWith("image/")) {
         return cb(new Error("Profile image must be an image file"), false);
      }
      cb(null, true);
    }
  }).fields(fields)
};
