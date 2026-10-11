import userRepository from '../repositories/UserRepository.js';
import authService from '../services/AuthService.js';

// Usuario administrador por defecto (datos de prueba del laboratorio)
const ADMIN = {
    email: 'admin@tecsup.edu.pe',
    password: 'Admin123#',
    name: 'Admin',
    lastName: 'Tecsup',
    phoneNumber: '987654321',
    birthdate: '1995-05-15',
    address: 'Av. Cascanueces 2221, Santa Anita',
    roles: ['user', 'admin']
};

export default async function seedUsers() {

    const existing = await userRepository.findByEmail(ADMIN.email);
    if (!existing) {
        await authService.signUp(ADMIN);
        console.log(`Seeded admin: ${ADMIN.email}`);
    }
}
