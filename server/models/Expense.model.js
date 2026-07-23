const mongoose = require('mongoose');

const EXPENSE_CATEGORIES = [
  'Fuel',
  'Service',
  'Insurance',
  'PUC',
  'Repair',
  'Accessories',
  'Parking',
  'Toll',
  'Fine',
  'Other',
];

const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'NetBanking', 'Other'];

const expenseSchema = new mongoose.Schema(
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

    category: {
      type:     String,
      enum:     EXPENSE_CATEGORIES,
      required: [true, 'Expense category is required'],
      index:    true,
    },

    title: {
      type:      String,
      required:  [true, 'Expense title is required'],
      trim:      true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },

    description: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    amount: {
      type:     Number,
      required: [true, 'Expense amount is required'],
      min:      [0.01, 'Amount must be greater than 0'],
    },

    expenseDate: {
      type:     Date,
      required: [true, 'Expense date is required'],
      default:  Date.now,
      index:    true,
    },

    paymentMethod: {
      type:    String,
      enum:    PAYMENT_METHODS,
      default: 'Card',
    },

    receiptImage: {
      type:    String,
      default: null,
    },

    receiptImagePublicId: {
      type:    String,
      default: null,
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

expenseSchema.index({ user: 1, expenseDate: -1 });
expenseSchema.index({ user: 1, category: 1 });

const Expense = mongoose.model('Expense', expenseSchema);
module.exports = Expense;
