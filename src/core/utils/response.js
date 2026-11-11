exports.success = (res, message, data = null, code = 200) => {
  return res.status(code).json({ status: true, message, data });
};

exports.successWithPagination = (res, message, data = [], pagination = {}, code = 200) => {
  return res.status(code).json({
    success: true,
    message,
    pagination: {
      total: pagination.total || 0,
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      totalPage: Math.ceil((pagination.total || 0) / (pagination.limit || 10))
    },
    data
  });
};

exports.error = (res, message = 'Error', code = 500) => {
  return res.status(code).json({ status: false, message });
};
