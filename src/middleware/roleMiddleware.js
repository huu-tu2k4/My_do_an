const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user || !user.roleId) {
            return res.status(403).json({ errCode: 1, errMessage: 'Access denied - missing role' });
        }
        if (!allowedRoles.includes(user.roleId)) {
            return res.status(403).json({ errCode: 1, errMessage: 'Access denied - insufficient permissions' });
        }
        next();
    }
}

export default authorizeRoles;
