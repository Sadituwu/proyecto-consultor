import { HomeFilled, Tickets, User, Setting, Avatar, FolderOpened, DataAnalysis, List, Medal, Calendar, Trophy } from '@element-plus/icons-vue'

export const menuItems = [

    { title: 'Inicio',           icon: DataAnalysis, routeName: '/dashboard',    roles: ['admin', 'client', 'support'] },
    { title: 'Mi Perfil',        icon: Avatar,       routeName: '/perfil',       roles: ['admin', 'client', 'support'] },
    { title: 'Buscar Mentores',  icon: Medal,        routeName: '/mentores',     roles: ['admin', 'client', 'support'] },
    { title: 'Mis Sesiones',     icon: Calendar,     routeName: '/sesiones',     roles: ['admin', 'client', 'support'] },
    { title: 'Mis Valoraciones', icon: Trophy,       routeName: '/valoraciones', roles: ['admin', 'client', 'support'] },

];

export default menuItems;
