const { validationResult } = require('express-validator');
const Document              = require('../models/Document.model');
const Vehicle               = require('../models/Vehicle.model');
const Reminder              = require('../models/Reminder.model');
const ApiResponse           = require('../utils/ApiResponse');
const cloudinary            = require('../utils/cloudinary');

// Helper to upload file buffer to Cloudinary (supports PDF & images)
const uploadToCloudinary = (fileBuffer, originalName, mimeType, folder = 'autocare/documents') => {
  return new Promise((resolve, reject) => {
    if (!cloudinary || !process.env.CLOUDINARY_CLOUD_NAME) {
      // Fallback data URI for local test environment
      const base64 = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
      return resolve({ secure_url: base64, public_id: `local_doc_${Date.now()}` });
    }

    const isPdf = mimeType.includes('pdf') || originalName.toLowerCase().endsWith('.pdf');
    const resource_type = isPdf ? 'raw' : 'auto';

    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

// Helper to delete asset from Cloudinary
const deleteFromCloudinary = async (publicId, mimeType = '') => {
  if (!publicId || publicId.startsWith('local_')) return;
  try {
    if (cloudinary && process.env.CLOUDINARY_CLOUD_NAME) {
      const isPdf = mimeType.includes('pdf') || publicId.endsWith('.pdf');
      await cloudinary.uploader.destroy(publicId, { resource_type: isPdf ? 'raw' : 'image' });
    }
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
};

// Helper to auto-create or update an Expiry Reminder for a document
const syncDocumentExpiryReminder = async (document) => {
  if (!document.expiryDate) return;

  try {
    const title = `${document.documentType} Expiry: ${document.title}`;
    let reminderType = 'Custom';
    if (document.documentType === 'Insurance') reminderType = 'Insurance';
    else if (document.documentType === 'PUC' || document.documentType === 'Pollution Certificate') reminderType = 'PUC';
    else if (document.documentType === 'Warranty') reminderType = 'Warranty';

    const diffDays = Math.ceil((new Date(document.expiryDate) - Date.now()) / (24 * 60 * 60 * 1000));
    const priority = diffDays <= 15 ? 'High' : diffDays <= 30 ? 'Medium' : 'Low';

    await Reminder.findOneAndUpdate(
      { user: document.user, description: `Auto-generated for document ${document._id}` },
      {
        user: document.user,
        vehicle: document.vehicle || null,
        title,
        description: `Auto-generated for document ${document._id}`,
        reminderType,
        dueDate: document.expiryDate,
        status: diffDays < 0 ? 'Overdue' : 'Pending',
        priority,
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('Document reminder sync error:', err.message);
  }
};

// ─── GET /api/documents/stats ──────────────────────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const { vehicleId } = req.query;
    const query = { user: req.user._id };
    if (vehicleId) query.vehicle = vehicleId;

    const totalDocuments = await Document.countDocuments(query);

    const now  = new Date();
    const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiringSoonCount = await Document.countDocuments({
      ...query,
      expiryDate: { $gte: now, $lte: soon },
    });

    const recentUploads = await Document.find(query)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('vehicle', 'brand model registrationNumber');

    res.status(200).json(
      ApiResponse.success({
        totalDocuments,
        expiringSoonCount,
        recentUploads,
      })
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/documents ────────────────────────────────────────────────────────
const getDocuments = async (req, res, next) => {
  try {
    const {
      search,
      documentType,
      vehicleId,
      sort = '-createdAt',
      page = 1,
      limit = 20,
    } = req.query;

    const query = { user: req.user._id };

    if (documentType) query.documentType = documentType;
    if (vehicleId) query.vehicle = vehicleId;

    if (search && search.trim()) {
      const rx = { $regex: search.trim(), $options: 'i' };
      query.$or = [{ title: rx }, { description: rx }, { tags: rx }];
    }

    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip     = (pageNum - 1) * limitNum;

    const [documents, total] = await Promise.all([
      Document.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('vehicle', 'brand model registrationNumber vehicleType'),
      Document.countDocuments(query),
    ]);

    res.status(200).json(
      ApiResponse.success({
        documents,
        pagination: {
          total,
          page:  pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1,
        },
      })
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/documents/:id ────────────────────────────────────────────────────
const getDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, user: req.user._id }).populate('vehicle');
    if (!document) return res.status(404).json(ApiResponse.error('Document not found'));

    res.status(200).json(ApiResponse.success({ document }));
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/documents ───────────────────────────────────────────────────────
const createDocument = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(ApiResponse.error('Validation failed', errors.array()));
    }

    if (!req.file) {
      return res.status(400).json(ApiResponse.error('Document file (PDF or Image) is required'));
    }

    const {
      vehicleId, documentType, title, description, issueDate,
      expiryDate, tags,
    } = req.body;

    let vehicle = null;
    if (vehicleId) {
      vehicle = await Vehicle.findOne({ _id: vehicleId, owner: req.user._id });
      if (!vehicle) return res.status(404).json(ApiResponse.error('Associated vehicle not found'));
    }

    const uploadRes = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    const doc = await Document.create({
      user: req.user._id,
      vehicle: vehicle ? vehicle._id : null,
      documentType,
      title: title.trim(),
      description,
      issueDate: issueDate || null,
      expiryDate: expiryDate || null,
      fileUrl: uploadRes.secure_url,
      filePublicId: uploadRes.public_id,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : [],
    });

    // Auto-create expiry reminder if expiry date is set
    if (expiryDate) {
      await syncDocumentExpiryReminder(doc);
    }

    res.status(201).json(ApiResponse.success({ document: doc }, 'Document uploaded successfully'));
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/documents/:id ────────────────────────────────────────────────────
const updateDocument = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(ApiResponse.error('Validation failed', errors.array()));
    }

    const document = await Document.findOne({ _id: req.params.id, user: req.user._id });
    if (!document) return res.status(404).json(ApiResponse.error('Document not found'));

    const {
      vehicleId, documentType, title, description, issueDate,
      expiryDate, tags,
    } = req.body;

    if (vehicleId) {
      const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: req.user._id });
      if (!vehicle) return res.status(404).json(ApiResponse.error('Associated vehicle not found'));
    }

    let fileUrl      = document.fileUrl;
    let filePublicId = document.filePublicId;
    let fileType     = document.fileType;
    let fileSize     = document.fileSize;

    if (req.file) {
      await deleteFromCloudinary(document.filePublicId, document.fileType);
      const uploadRes = await uploadToCloudinary(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      fileUrl      = uploadRes.secure_url;
      filePublicId = uploadRes.public_id;
      fileType     = req.file.mimetype;
      fileSize     = req.file.size;
    }

    const updated = await Document.findByIdAndUpdate(
      document._id,
      {
        vehicle: vehicleId !== undefined ? (vehicleId || null) : document.vehicle,
        documentType: documentType || document.documentType,
        title: title ? title.trim() : document.title,
        description: description !== undefined ? description : document.description,
        issueDate: issueDate !== undefined ? (issueDate || null) : document.issueDate,
        expiryDate: expiryDate !== undefined ? (expiryDate || null) : document.expiryDate,
        fileUrl,
        filePublicId,
        fileType,
        fileSize,
        tags: tags !== undefined ? (Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : []) : document.tags,
      },
      { new: true, runValidators: true }
    );

    if (updated.expiryDate) {
      await syncDocumentExpiryReminder(updated);
    }

    res.status(200).json(ApiResponse.success({ document: updated }, 'Document record updated'));
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/documents/:id ─────────────────────────────────────────────────
const deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, user: req.user._id });
    if (!document) return res.status(404).json(ApiResponse.error('Document not found'));

    await deleteFromCloudinary(document.filePublicId, document.fileType);

    // Also remove auto-generated reminder if present
    await Reminder.deleteOne({ user: req.user._id, description: `Auto-generated for document ${document._id}` });

    await document.deleteOne();
    res.status(200).json(ApiResponse.success({}, 'Document deleted successfully'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStats,
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
};
