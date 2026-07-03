import { DataAnalysis, Avatar, Medal, Calendar, Trophy, User, Collection, Setting } from '@element-plus/icons-vue'
import { ROL } from '@/utils/roles'

export const menuItems = [
  {
    title:     'Inicio',
    icon:      DataAnalysis,
    routeName: '/dashboard',
    roles:     [ROL.APRENDIZ, ROL.MENTOR, ROL.ADMIN],
  },
  {
    title:     'Mi Perfil',
    icon:      Avatar,
    routeName: '/perfil',
    roles:     [ROL.APRENDIZ, ROL.MENTOR, ROL.ADMIN],
  },
  {
    title:     'Buscar Mentores',
    icon:      Medal,
    routeName: '/mentores',
    roles:     [ROL.APRENDIZ, ROL.ADMIN],
  },
  {
    title:     'Mis Sesiones',
    icon:      Calendar,
    routeName: '/sesiones',
    roles:     [ROL.APRENDIZ, ROL.MENTOR, ROL.ADMIN],
  },
  {
    title:     'Mis Valoraciones',
    icon:      Trophy,
    routeName: '/valoraciones',
    roles:     [ROL.APRENDIZ, ROL.MENTOR, ROL.ADMIN],
  },
  {
    title: 'Administración',
    icon:  Setting,
    roles: [ROL.ADMIN],
    children: [
      {
        title:     'Usuarios',
        icon:      User,
        routeName: '/usuarios',
      },
      {
        title:     'Áreas de Interés',
        icon:      Collection,
        routeName: '/areas-interes',
      },
    ],
  },
]

export default menuItems
