export const isAdminRole = (role?: string) => {
    const r = role?.toLowerCase();
    return r === "admin" || r === "administrador";
};

