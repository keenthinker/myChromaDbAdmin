export function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next(); // OK
    }
    res.redirect('/'); // Not authenticated, redirect to login
}

export function checkAuthenticatedJson(req, res, next) {
    if (req.isAuthenticated()) {
        return next(); // proceed to handler
    }
    res.status(401).json({ error: 'Not authenticated' });
}

export function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        // If user is already authenticated, they shouldn't see login/register pages
        return res.redirect('/');
    }
    // If not authenticated, proceed to the requested page (e.g., login or register)
    next();
}