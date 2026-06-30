import { HomeFilled, Tickets, User, Setting, Avatar, FolderOpened, DataAnalysis, List, Medal } from '@element-plus/icons-vue'

export const menuItems = [

    { title: 'Inicio',          icon: DataAnalysis, routeName: '/dashboard', roles: ['admin', 'client', 'support'] },
    { title: 'Mi Perfil',       icon: Avatar,       routeName: '/perfil',    roles: ['admin', 'client', 'support'] },
    { title: 'Buscar Mentores', icon: Medal,        routeName: '/mentores',  roles: ['admin', 'client', 'support'] },
    { title: 'Usuarios',        icon: User,         routeName: '/usuarios',  roles: ['admin'] },

];

export default menuItems;
