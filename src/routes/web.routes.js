import express from 'express';

const router = express.Router();

// Las vistas se protegen en el cliente (el token JWT vive en sessionStorage).
// requiredRoles indica qué roles necesita cada página.
router.get('/', (req, res) => res.redirect('/signIn'));
router.get('/signIn', (req, res) => res.render('signIn', { title: 'Iniciar sesión', requiredRoles: null }));
router.get('/signUp', (req, res) => res.render('signUp', { title: 'Registro', requiredRoles: null }));
router.get('/profile', (req, res) => res.render('profile', { title: 'Mi cuenta', requiredRoles: [] }));
router.get('/dashboard', (req, res) => res.render('dashboard', { title: 'Dashboard', requiredRoles: ['user', 'admin'] }));
router.get('/admin', (req, res) => res.render('admin', { title: 'Administración', requiredRoles: ['admin'] }));
router.get('/403', (req, res) => res.status(403).render('403', { title: 'Acceso denegado', requiredRoles: null }));

export default router;
