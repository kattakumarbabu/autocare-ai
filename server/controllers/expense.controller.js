const { validationResult } = require('express-validator');
const Expense               = require('../models/Expense.model');
const Vehicle               = require('../models/Vehicle.model');
const ApiResponse           = require('../utils/ApiResponse');
const cloudinary            = require('../utils/cloudinary');

// Helper to upload buffer/file to Cloudinary
const uploadToCloudinary = (fileBuffer, folder = 'autocare/receipts') => {
  return new Promise((resolve, reject) => {
    if (!cloudinary || !process.env.CLOUDINARY_CLOUD_NAME) {
      // Fallback base64 / mock if Cloudinary keys aren't set
      const base64 = `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;
      return resolve({ secure_url: base64, public_id: `local_${Date.now()}` });
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

// Helper to delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  if (!publicId || publicId.startsWith('local_')) return;
  try {
    if (cloudinary && process.env.CLOUDINARY_CLOUD_NAME) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (err) {
    console.error('Cloudinary destroy error:', err.message);
  }
};

// ─── GET /api/expenses/analytics ────────────────────────────────────────────────
const getAnalytics = async (req, res, next) => {
  try {
    const { vehicleId } = req.query;
    const query = { user: req.user._id };
    if (vehicleId) query.vehicle = vehicleId;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear  = new Date(now.getFullYear(), 0, 1);

    const allExpenses = await Expense.find(query)
      .sort({ expenseDate: -1 })
      .populate('vehicle', 'brand model registrationNumber');

    const totalExpenses = Number(allExpenses.reduce((sum, e) => sum + (e.amount || 0), 0).toFixed(2));

    const currentMonthExpensesList = allExpenses.filter((e) => new Date(e.expenseDate) >= startOfMonth);
    const thisMonthExpenses = Number(currentMonthExpensesList.reduce((sum, e) => sum + (e.amount || 0), 0).toFixed(2));

    const currentYearExpensesList  = allExpenses.filter((e) => new Date(e.expenseDate) >= startOfYear);
    const thisYearExpenses  = Number(currentYearExpensesList.reduce((sum, e) => sum + (e.amount || 0), 0).toFixed(2));

    const amounts = allExpenses.map((e) => e.amount);
    const highestExpense = amounts.length > 0 ? Math.max(...amounts) : 0;
    const lowestExpense  = amounts.length > 0 ? Math.min(...amounts) : 0;

    // Monthly average (total / distinct months or 1)
    const monthKeys = new Set(allExpenses.map((e) => {
      const d = new Date(e.expenseDate);
      return `${d.getFullYear()}-${d.getMonth()}`;
    }));
    const avgMonthlyExpense = monthKeys.size > 0 ? Number((totalExpenses / monthKeys.size).toFixed(2)) : 0;

    // Category Breakdown
    const catMap = {};
    allExpenses.forEach((e) => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });

    const categoryBreakdown = Object.keys(catMap).map((cat) => ({
      category: cat,
      amount: Number(catMap[cat].toFixed(2)),
      percentage: totalExpenses > 0 ? Number(((catMap[cat] / totalExpenses) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.amount - a.amount);

    const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0].category : 'None';

    // Vehicle Breakdown
    const vehMap = {};
    allExpenses.forEach((e) => {
      const vName = e.vehicle ? `${e.vehicle.brand} ${e.vehicle.model}` : 'Unassigned';
      const vId   = e.vehicle ? e.vehicle._id.toString() : 'unassigned';
      if (!vehMap[vId]) vehMap[vId] = { vehicleId: vId, name: vName, amount: 0 };
      vehMap[vId].amount += e.amount;
    });

    const vehicleBreakdown = Object.values(vehMap).map((v) => ({
      ...v,
      amount: Number(v.amount.toFixed(2)),
      percentage: totalExpenses > 0 ? Number(((v.amount / totalExpenses) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.amount - a.amount);

    // Monthly Spending Trends (Last 6 Months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const mExpenses = allExpenses.filter((e) => {
        const date = new Date(e.expenseDate);
        return date >= d && date < nextD;
      });

      const total = mExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      monthlyTrends.push({
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        amount: Math.round(total),
      });
    }

    // Budget Status (Default monthly budget threshold: e.g. $500 or customizable)
    const monthlyBudget = 500;
    let budgetStatus = 'Normal';
    if (thisMonthExpenses > monthlyBudget) {
      budgetStatus = 'Exceeded';
    } else if (thisMonthExpenses >= monthlyBudget * 0.8) {
      budgetStatus = 'Warning';
    }

    res.status(200).json(
      ApiResponse.success({
        totalExpenses,
        thisMonthExpenses,
        thisYearExpenses,
        avgMonthlyExpense,
        highestExpense,
        lowestExpense,
        topCategory,
        monthlyBudget,
        budgetStatus,
        categoryBreakdown,
        vehicleBreakdown,
        monthlyTrends,
        totalCount: allExpenses.length,
      })
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/expenses ─────────────────────────────────────────────────────────
const getExpenses = async (req, res, next) => {
  try {
    const {
      search,
      category,
      vehicleId,
      startDate,
      endDate,
      sort = '-expenseDate',
      page = 1,
      limit = 20,
    } = req.query;

    const query = { user: req.user._id };

    if (category) query.category = category;
    if (vehicleId) query.vehicle = vehicleId;
    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) query.expenseDate.$gte = new Date(startDate);
      if (endDate) query.expenseDate.$lte = new Date(endDate);
    }
    if (search && search.trim()) {
      const rx = { $regex: search.trim(), $options: 'i' };
      query.$or = [{ title: rx }, { description: rx }, { tags: rx }];
    }

    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip     = (pageNum - 1) * limitNum;

    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('vehicle', 'brand model registrationNumber vehicleType'),
      Expense.countDocuments(query),
    ]);

    res.status(200).json(
      ApiResponse.success({
        expenses,
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

// ─── GET /api/expenses/:id ─────────────────────────────────────────────────────
const getExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id }).populate('vehicle');
    if (!expense) return res.status(404).json(ApiResponse.error('Expense record not found'));

    res.status(200).json(ApiResponse.success({ expense }));
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/expenses ────────────────────────────────────────────────────────
const createExpense = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(ApiResponse.error('Validation failed', errors.array()));
    }

    const {
      vehicleId, category, title, description, amount,
      expenseDate, paymentMethod, tags,
    } = req.body;

    let vehicle = null;
    if (vehicleId) {
      vehicle = await Vehicle.findOne({ _id: vehicleId, owner: req.user._id });
      if (!vehicle) return res.status(404).json(ApiResponse.error('Associated vehicle not found'));
    }

    let receiptImage = null;
    let receiptImagePublicId = null;

    if (req.file) {
      const uploadRes = await uploadToCloudinary(req.file.buffer);
      receiptImage = uploadRes.secure_url;
      receiptImagePublicId = uploadRes.public_id;
    }

    const expense = await Expense.create({
      user: req.user._id,
      vehicle: vehicle ? vehicle._id : null,
      category,
      title,
      description,
      amount: Number(amount),
      expenseDate: expenseDate || new Date(),
      paymentMethod: paymentMethod || 'Card',
      receiptImage,
      receiptImagePublicId,
      tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : [],
    });

    res.status(201).json(ApiResponse.success({ expense }, 'Expense recorded successfully'));
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/expenses/:id ─────────────────────────────────────────────────────
const updateExpense = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(ApiResponse.error('Validation failed', errors.array()));
    }

    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json(ApiResponse.error('Expense record not found'));

    const {
      vehicleId, category, title, description, amount,
      expenseDate, paymentMethod, tags,
    } = req.body;

    if (vehicleId) {
      const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: req.user._id });
      if (!vehicle) return res.status(404).json(ApiResponse.error('Associated vehicle not found'));
    }

    let receiptImage = expense.receiptImage;
    let receiptImagePublicId = expense.receiptImagePublicId;

    if (req.file) {
      if (expense.receiptImagePublicId) {
        await deleteFromCloudinary(expense.receiptImagePublicId);
      }
      const uploadRes = await uploadToCloudinary(req.file.buffer);
      receiptImage = uploadRes.secure_url;
      receiptImagePublicId = uploadRes.public_id;
    }

    const updated = await Expense.findByIdAndUpdate(
      expense._id,
      {
        vehicle: vehicleId !== undefined ? (vehicleId || null) : expense.vehicle,
        category: category || expense.category,
        title: title || expense.title,
        description: description !== undefined ? description : expense.description,
        amount: amount !== undefined ? Number(amount) : expense.amount,
        expenseDate: expenseDate || expense.expenseDate,
        paymentMethod: paymentMethod || expense.paymentMethod,
        receiptImage,
        receiptImagePublicId,
        tags: tags !== undefined ? (Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : []) : expense.tags,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json(ApiResponse.success({ expense: updated }, 'Expense entry updated'));
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/expenses/:id ──────────────────────────────────────────────────
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json(ApiResponse.error('Expense record not found'));

    if (expense.receiptImagePublicId) {
      await deleteFromCloudinary(expense.receiptImagePublicId);
    }

    await expense.deleteOne();
    res.status(200).json(ApiResponse.success({}, 'Expense entry deleted'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnalytics,
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
};
