export const getAdminAccess = (roles: string[]) => {
    return (roles.includes('Coach') || roles.includes('Project Management')) ?? false;
}
