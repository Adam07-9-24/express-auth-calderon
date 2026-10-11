// La creación automática de usuarios está desactivada deliberadamente.
// Las cuentas existentes en MongoDB Atlas no se consultan ni se modifican desde este módulo.
export default async function seedUsers() {
    return { created: false };
}
