import authService from '../services/AuthService.js';

const REQUIRED_FIELDS = ['email', 'password', 'name', 'lastName', 'phoneNumber', 'birthdate'];

class AuthController {

    async signUp(req, res, next) {
        try {
            // Los roles no se aceptan desde el cliente: todo registro público es rol "user"
            const { roles, ...payload } = req.body;
            const missing = REQUIRED_FIELDS.filter(f => !payload[f]);
            if (missing.length)
                return res.status(400).json({ message: `Campos requeridos: ${missing.join(', ')}` });

            const user = await authService.signUp(payload);
            return res.status(201).json(user);
        } catch (err) {
            next(err);
        }
    }

    async signIn(req, res, next) {
        try {
            const { email, password } = req.body;

            if (!email || !password)
                return res.status(400).json({ message: 'El email y password son requeridos' });

            const token = await authService.signIn({ email, password });
            return res.status(200).json(token);
        } catch (err) {
            next(err);
        }
    }
}

export default new AuthController();
