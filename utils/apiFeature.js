// utils/journalQuery.js

const escapeRegex = (str = "") =>
  String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

//  phân trang
exports.buildPagination = (
  query = {},
  { defaultLimit = 10, maxLimit = 50 } = {},
) => {
  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const limit = Math.min(
    Math.max(parseInt(query.limit || String(defaultLimit), 10), 1),
    maxLimit,
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

//  filter + search
exports.buildJournalFilter = (query = {}, userId) => {
  const { q, mood, tag, from, to } = query;

  const filter = { user: userId, isDeleted: false };

  if (mood) filter.mood = mood;
  if (tag) filter.tags = tag;

  if (from || to) {
    filter.entryDate = {};
    if (from) filter.entryDate.$gte = new Date(from);
    if (to) filter.entryDate.$lte = new Date(to);
  }

  if (q) {
    const keyword = escapeRegex(q.trim());
    filter.$or = [
      { title: { $regex: keyword, $options: "i" } },
      { content: { $regex: keyword, $options: "i" } },
      { tags: { $regex: keyword, $options: "i" } },
    ];
  }

  return filter;
};
