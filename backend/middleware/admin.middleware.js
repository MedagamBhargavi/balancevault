
function adminMiddleware(req, res, next) {
  try {
    // Check whether the user is authenticated
    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required."
      });
    }

    // Check administrator role
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        status: "error",
        message: "Access denied. Admin privileges required."
      });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);

    return res.status(500).json({
      status: "error",
      message: "Internal server error."
    });
  }
}

export default adminMiddleware;
