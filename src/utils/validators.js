// min 8 caracteres, min 1 mayúscula, min 1 dígito, min 1 caracter especial ( # $ % & * @ )
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[#$%&*@]).{8,}$/;

export function validatePassword(password) {
    if (!PASSWORD_REGEX.test(password ?? '')) {
        const err = new Error('El password debe tener mínimo 8 caracteres, 1 mayúscula, 1 dígito y 1 caracter especial (# $ % & * @)');
        err.status = 400;
        throw err;
    }
}

export function validateProfileUrl(value) {
    if (!value) return;
    try {
        const url = new URL(value);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    } catch {
        const err = new Error('La URL del avatar debe utilizar el protocolo http o https');
        err.status = 400;
        throw err;
    }
}

export function calculateAge(birthdate) {
    if (!birthdate) return null;
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getUTCFullYear() - birth.getUTCFullYear();
    const m = today.getUTCMonth() - birth.getUTCMonth();
    if (m < 0 || (m === 0 && today.getUTCDate() < birth.getUTCDate())) age--;
    return age;
}
