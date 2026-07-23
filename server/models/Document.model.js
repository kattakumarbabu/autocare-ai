const mongoose = require('mongoose');

const DOCUMENT_TYPES = [
  'RC',
  'Insurance',
  'PUC',
  'Driving License',
  'Warranty',
  'Service Bill',
  'Pollution Certificate',
  'Other',
];

const documentSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'User reference is required'],
      index:    true,
    },

    vehicle: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Vehicle',
      default: null,
      index:   true,
    },

    documentType: {
      type:     String,
      enum:     DOCUMENT_TYPES,
      required: [true, 'Document type is required'],
      index:    true,
    },

    title: {
      type:      String,
      required:  [true, 'Document title is required'],
      trim:      true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },

    description: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    issueDate: {
      type:    Date,
      default: null,
    },

    expiryDate: {
      type:    Date,
      default: null,
      index:   true,
    },

    fileUrl: {
      type:     String,
      required: [true, 'Document file URL is required'],
    },

    filePublicId: {
      type:     String,
      required: [true, 'Document file public ID is required'],
    },

    fileType: {
      type:    String,
      default: 'application/pdf',
    },

    fileSize: {
      type:    Number,
      default: 0,
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

documentSchema.index({ user: 1, expiryDate: 1 });
documentSchema.index({ user: 1, createdAt: -1 });

const Document = mongoose.model('Document', documentSchema);
module.exports = Document;
