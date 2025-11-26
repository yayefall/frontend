import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import Vehicule from '../components/Vehicule.vue'
import Driver from '../components/Driver.vue'
import Lavage from '../components/Lavage.vue'
import Entretien from '../components/Entretien.vue'
import Register from '../components/Register.vue'
import Headers from '../components/Headers.vue'
import Dashboard from '../components/Dashboard.vue'

const routes = [
  {
    path: '/login',
    component: Login
  },
  {
    path: '/header',
    component: Headers,
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'vehicules', component: Vehicule },
      { path: 'drivers', component: Driver },
      { path: 'lavages', component: Lavage },
      { path: 'entretiens', component: Entretien },
      { path: 'register', component: Register },

      { path: '', redirect: 'header/vehicules' }
    ]
  },
  { path: '/', redirect: '/login' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem("auth_token");

  if (to.path !== "/login" && !isAuthenticated) {
    next("/login");
  } else {
    next();
  }
});

export default router
