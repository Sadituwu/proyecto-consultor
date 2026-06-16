import { HomeFilled, Tickets, User, Setting, Avatar, FolderOpened, DataAnalysis , List } from '@element-plus/icons-vue'

export const menuItems = [

    { title: 'Inicio', icon: DataAnalysis , routeName: '/modelo', roles: ['admin', 'client', 'support'] },
    { title: 'Consultores', icon: List  , routeName: '/registro', roles: ['admin', 'client', 'support'] },

];

export default menuItems;
