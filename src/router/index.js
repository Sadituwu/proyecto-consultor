import { createRouter, createWebHistory } from 'vue-router'

/*----  Guest públicas ---*/
import GuestLayout from '@/layout/GuestLayout.vue'

/* --- Vistas públicas --- */
import Home from '@/views/Home.vue'
import Login from '@/views/auth/Login.vue'
import GoogleCallback from '@/views/auth/GoogleCallback.vue'

/* --- Vistas privadas --- */

import AuthLayout from '@/layout/AuthLayout.vue'
import Dashboard from '@/views/Dashboard.vue'
import tableUsuarios from '@/views/administracion/tableUsuarios.vue'
import FormPerfil from '@/views/perfil/FormPerfil.vue'
import BuscarMentores from '@/views/mentores/BuscarMentores.vue'
import MisSesiones from '@/views/sesiones/MisSesiones.vue'
import MisValoraciones from '@/views/valoraciones/MisValoraciones.vue'



const routes = [
    {
        path: '/',
        component: GuestLayout,
        meta: { guestOnly: true },
        children: [
            { path: '', name: 'Home', component: Home },
            { path: 'login', name: 'Login', component: Login },
        ]
    },

    {
        path: '/auth',
        component: GuestLayout,
        children: [
            { path: 'callback', name: 'GoogleCallback', component: GoogleCallback },
        ]
    },

    {
        path: '/',
        component: AuthLayout,
        children: [
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: Dashboard,
                meta: { requiresAuth: true },
                roles: ['admin', 'client', 'support']
            },
            {
                path: 'usuarios',
                name: 'TableUsuarios',
                component: tableUsuarios,
                meta: { requiresAuth: true },
                roles: ['admin', 'client', 'support']
            },
            {
                path: 'perfil',
                name: 'UserPerfil',
                component: FormPerfil,
                meta: { requiresAuth: true }
            },
            {
                path: 'mentores',
                name: 'BuscarMentores',
                component: BuscarMentores,
                meta: { requiresAuth: true }
            },
            {
                path: 'sesiones',
                name: 'MisSesiones',
                component: MisSesiones,
                meta: { requiresAuth: true }
            },
            {
                path: 'valoraciones',
                name: 'MisValoraciones',
                component: MisValoraciones,
                meta: { requiresAuth: true }
            },
        ],
    },

    // Ruta global para cualquier URL inválida
    {
        path: '/:pathMatch(.*)*',
        redirect: '/dashboard'
    }
]


const router = createRouter({
    history: createWebHistory(),
    routes
})

/* ----------------- MIDDLEWARE ----------------- */
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('access_token');
    const user = JSON.parse(localStorage.getItem('user'));

    // Si ya está logeado, no acceder a páginas públicas
    if (to.meta.guestOnly && token) {
        return next({ name: 'Dashboard' });
    }

    // Si la ruta privada no tiene token → login
    if (to.meta.requiresAuth && !token) {
        return next({ name: 'Login' });
    }

    // Validación de roles
    if (to.meta.roles && user) {
        const hasRole = to.meta.roles.includes(user.role);
        if (!hasRole) {
            return next({ name: 'NotFound' });
        }
    }

    next();
})

export default router
