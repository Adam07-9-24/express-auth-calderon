import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import userRepository from '../repositories/UserRepository.js';
import { validatePassword, validateProfileUrl, calculateAge } from '../utils/validators.js';

const EDITABLE_FIELDS = ['email', 'name', 'lastName', 'phoneNumber', 'birthdate', 'url_profile', 'address'];

// Nunca se devuelve el password
function toDTO(user) {
    return {
        id: user._id,
        email: user.email,
        name: user.name,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        birthdate: user.birthdate,
        age: calculateAge(user.birthdate),
        url_profile: user.url_profile,
        address: user.address,
        roles: user.roles.map(r => r.name),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
}

class UserService {

    async getAll() {
        const users = await userRepository.getAll();
        return users.map(toDTO);
    }

    async getById(id) {
        const user = mongoose.isValidObjectId(id) ? await userRepository.findById(id) : null;
        if (!user) {
            const err = new Error('Usuario no encontrado');
            err.status = 404;
            throw err;
        }
        return toDTO(user);
    }

    async updateMe(id, data) {
        const changes = {};
        for (const field of EDITABLE_FIELDS) {
            if (data[field] !== undefined) changes[field] = data[field];
        }

        if (changes.email) {
            const existing = await userRepository.findByEmail(changes.email.toLowerCase().trim());
            if (existing && String(existing._id) !== String(id)) {
                const err = new Error('El email ya se encuentra en uso');
                err.status = 400;
                throw err;
            }
        }

        if (changes.url_profile !== undefined) validateProfileUrl(changes.url_profile);

        // Cambio de password opcional
        if (data.password) {
            validatePassword(data.password);
            const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10', 10);
            changes.password = await bcrypt.hash(data.password, saltRounds);
        }

        const user = await userRepository.update(id, changes);
        if (!user) {
            const err = new Error('Usuario no encontrado');
            err.status = 404;
            throw err;
        }
        return toDTO(user);
    }
}

export default new UserService();
