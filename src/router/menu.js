import { DataAnalysis, Avatar, Medal, Calendar, Trophy, User } from '@element-plus/icons-vue'
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
    title:     'Usuarios',
    icon:      User,
    routeName: '/usuarios',
    roles:     [ROL.ADMIN],
  },
]

export default menuItems
