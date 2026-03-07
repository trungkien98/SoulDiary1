// utils/apiFeature.js

const escapeRegex = (str = "") =>
  String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// APIFeatures class for query building (chainable interface)
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    // Remove pagination, sort fields
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

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
  
  // Use $in operator for array filtering
  if (tag) {
    const tagLower = tag.toLowerCase();
    filter.tags = { $regex: tagLower, $options: "i" };
  }

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

module.exports.APIFeatures = APIFeatures;

