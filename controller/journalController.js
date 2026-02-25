const mongoose = require("mongoose");
const Journal = require("../models/journalModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const { applyStreakByDate } = require("../utils/streak");
const { buildPagination, buildJournalFilter } = require("../utils/apiFeature");
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// POST /api/v1/journals
exports.createJournal = catchAsync(async (req, res, next) => {
  const { title, content, mood, tags, entryDate } = req.body;
  if (!content) return next(new AppError("Thiếu content", 400));

  const journal = await Journal.create({
    user: req.user._id,
    title,
    content,
    mood,
    tags,
    entryDate,
  });

  const user = await User.findById(req.user._id);
  console.log("before:", user.streakCount, user.lastStreakDate);
  applyStreakByDate(user, new Date());
  console.log("after:", user.streakCount, user.lastStreakDate);

  await user.save();

  res.status(201).json({
    status: "success",
    data: {
      journal,
      streak: {
        streakCount: user.streakCount,
        bestStreak: user.bestStreak,
        lastStreakDate: user.lastStreakDate,
      },
    },
  });
});
exports.getMyJournals = catchAsync(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query, {
    defaultLimit: 10,
    maxLimit: 50,
  });

  const filter = buildJournalFilter(req.query, req.user._id);

  const [journals, total] = await Promise.all([
    Journal.find(filter).sort({ entryDate: -1 }).skip(skip).limit(limit),
    Journal.countDocuments(filter),
  ]);

  res.json({
    status: "success",
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    results: journals.length,
    data: { journals },
  });
});

// GET /api/v1/journals/:id
exports.getJournal = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!isValidId(id)) return next(new AppError("id không hợp lệ", 400));

  const journal = await Journal.findOne({
    _id: id,
    user: req.user._id,
    isDeleted: false,
  });

  if (!journal) return next(new AppError("Không tìm thấy nhật ký", 404));
  res.json({ status: "success", data: { journal } });
});

// PATCH /api/v1/journals/:id
exports.updateJournal = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!isValidId(id)) return next(new AppError("id không hợp lệ", 400));

  const allowed = ["title", "content", "mood", "tags", "entryDate"];
  const update = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }

  const journal = await Journal.findOneAndUpdate(
    { _id: id, user: req.user._id, isDeleted: false },
    update,
    { new: true, runValidators: true },
  );

  if (!journal)
    return next(new AppError("Không tìm thấy nhật ký để cập nhật", 404));
  res.json({ status: "success", data: { journal } });
});

// DELETE /api/v1/journals/:id (soft delete)
exports.deleteJournal = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!isValidId(id)) return next(new AppError("id không hợp lệ", 400));

  const journal = await Journal.findOneAndUpdate(
    { _id: id, user: req.user._id, isDeleted: false },
    { isDeleted: true, deletedAt: new Date() },
    { new: true },
  );

  if (!journal) return next(new AppError("Không tìm thấy nhật ký để xóa", 404));
  res.status(204).json({ status: "success", data: null });
});
